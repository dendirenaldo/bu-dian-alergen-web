'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';
import { unwrapData } from '@/lib/unwrap';
import { Content } from '@/types';
import { useLocale } from '@/contexts/LocaleContext';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';
import DetailSkeleton from '@/components/ui/DetailSkeleton';

interface TocEntry {
  id: string;
  level: number;
  text: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // **bold**, *italic*, `code`, [label](url)
  const pattern = /(\*\*.+?\*\*|\*[^*]+?\*|`[^`]+?`|\[[^\]]+?\]\([^)]+?\))/g;
  const parts = text.split(pattern).filter((p) => p !== '');
  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={key} className="rounded bg-surface-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-surface-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = /^\[([^\]]+?)\]\(([^)]+?)\)$/.exec(part);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target={linkMatch[2].startsWith('/') ? undefined : '_blank'}
          rel={linkMatch[2].startsWith('/') ? undefined : 'noopener noreferrer'}
          className="font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={key}>{part}</span>;
  });
}

interface ParsedBlock {
  type: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'quote';
  text?: string;
  items?: string[];
}

function parseBody(body: string): { blocks: ParsedBlock[]; toc: TocEntry[] } {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const blocks: ParsedBlock[] = [];
  const toc: TocEntry[] = [];
  const usedIds = new Map<string, number>();

  const headingId = (text: string) => {
    const base = slugify(text) || 'section';
    const n = usedIds.get(base) ?? 0;
    usedIds.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };

  let paragraph: string[] = [];
  const flushParagraph = () => {
    if (paragraph.length > 0) {
      blocks.push({ type: 'p', text: paragraph.join(' ') });
      paragraph = [];
    }
  };

  let list: string[] | null = null;
  let listType: 'ul' | 'ol' | null = null;
  const flushList = () => {
    if (list && list.length > 0 && listType) {
      blocks.push({ type: listType, items: list });
    }
    list = null;
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const h3 = /^(?:###\s+|<h3[^>]*>)(.*?)(?:<\/h3>)?$/.exec(line);
    const h2 = /^(?:##\s+|<h2[^>]*>)(.*?)(?:<\/h2>)?$/.exec(line);
    const h1 = /^(?:#\s+|<h1[^>]*>)(.*?)(?:<\/h1>)?$/.exec(line);
    const ulItem = /^(?:[-*]\s+|<li[^>]*>)(.*?)(?:<\/li>)?$/.exec(line);
    const olItem = /^\d+[.)]\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);

    if (h3 || h2 || h1) {
      flushParagraph();
      flushList();
      const text = (h3?.[1] ?? h2?.[1] ?? h1?.[1] ?? '').replace(/<[^>]+>/g, '').trim() || line;
      const id = headingId(text);
      const level = h3 ? 3 : 2;
      toc.push({ id, level, text });
      blocks.push({ type: level === 3 ? 'h3' : 'h2', text: `${id}||${text}` });
    } else if (ulItem && !olItem) {
      flushParagraph();
      if (listType !== 'ul') {
        flushList();
        list = [];
        listType = 'ul';
      }
      list!.push(ulItem[1].replace(/<[^>]+>/g, '').trim());
    } else if (olItem) {
      flushParagraph();
      if (listType !== 'ol') {
        flushList();
        list = [];
        listType = 'ol';
      }
      list!.push(olItem[1].trim());
    } else if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'quote', text: quote[1] });
    } else {
      flushList();
      paragraph.push(line.replace(/<[^>]+>/g, ''));
    }
  }
  flushParagraph();
  flushList();
  return { blocks, toc };
}

interface LegalPageProps {
  slug: 'terms' | 'privacy';
  titleKey: string;
  subtitleKey: string;
  updatedKey: string;
  emptyKey: string;
}

export default function LegalPage({ slug, titleKey, subtitleKey, updatedKey, emptyKey }: LegalPageProps) {
  const { t } = useLocale();
  const [content, setContent] = useState<Content | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    setIsLoading(true);
    setError(null);
    api
      .get(API_ENDPOINTS.CONTENTS.BY_SLUG(slug), undefined, ctrl.signal)
      .then((res) => {
        if (cancelled) return;
        const data = unwrapData<Content>(res);
        setContent(data && typeof data === 'object' && 'title' in data ? data : null);
      })
      .catch((err: any) => {
        if (cancelled || err?.name === 'AbortError') return;
        // 404 = konten belum diterbitkan -> tampilkan empty state, bukan error
        if (err?.status === 404 || err?.statusCode === 404) {
          setContent(null);
          return;
        }
        setError(err?.message || t('api.err.loadFail'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const { blocks, toc } = useMemo(() => parseBody(content?.body || ''), [content?.body]);

  useEffect(() => {
    if (toc.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    const els: Element[] = [];
    for (const entry of toc) {
      const el = document.getElementById(entry.id);
      if (el) {
        observer.observe(el);
        els.push(el);
      }
    }
    return () => {
      for (const el of els) observer.unobserve(el);
      observer.disconnect();
    };
  }, [toc, blocks]);

  const updatedAt = (content as any)?.updatedAt || content?.publishedAt;
  const title = content?.title || t(titleKey);

  const tocNav = (
    <nav aria-label={t('common.toc')}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
        {t('common.toc')}
      </p>
      <ul className="space-y-1">
        {toc.map((entry) => (
          <li key={entry.id} className={entry.level === 3 ? 'pl-4' : ''}>
            <a
              href={`#${entry.id}`}
              aria-current={activeId === entry.id ? 'true' : undefined}
              className={cn(
                'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                activeId === entry.id
                  ? 'bg-primary-50 font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-100',
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <div className="page-container">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-surface-600 dark:text-surface-400">
            {content?.excerpt || t(subtitleKey)}
          </p>
          {updatedAt && (
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
              {t(updatedKey, { date: formatDateTime(updatedAt) })}
            </p>
          )}
        </div>

        {isLoading ? (
          <DetailSkeleton />
        ) : error ? (
          <Alert variant="error" title={t('api.err.loadFail')}>
            {error}
          </Alert>
        ) : !content || blocks.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-sm text-surface-500 dark:text-surface-400">
              {t(emptyKey)}
            </p>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            {toc.length > 0 && (
              <>
                <details className="lg:hidden">
                  <summary className="cursor-pointer rounded-xl border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200">
                    {t('common.toc')}
                  </summary>
                  <div className="mt-2 rounded-xl border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-900">
                    {tocNav}
                  </div>
                </details>
                <aside className="hidden lg:block">
                  <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-surface-200 bg-white p-4 dark:border-surface-800 dark:bg-surface-900">
                    {tocNav}
                  </div>
                </aside>
              </>
            )}
            <Card padding="lg">
              <article className="space-y-4 text-surface-700 dark:text-surface-300">
                {blocks.map((block, i) => {
                  if (block.type === 'h2' || block.type === 'h3') {
                    const [id, ...rest] = (block.text || '').split('||');
                    const text = rest.join('||');
                    const Tag = block.type;
                    return (
                      <Tag
                        key={i}
                        id={id}
                        className={cn(
                          'scroll-mt-24 font-bold text-surface-900 dark:text-surface-100',
                          block.type === 'h2' ? 'pt-4 text-xl' : 'pt-2 text-lg',
                        )}
                      >
                        <a href={`#${id}`} className="no-underline hover:underline">
                          {renderInline(text, `h-${i}`)}
                        </a>
                      </Tag>
                    );
                  }
                  if (block.type === 'ul') {
                    return (
                      <ul key={i} className="list-disc space-y-1.5 pl-6">
                        {(block.items || []).map((item, j) => (
                          <li key={j}>{renderInline(item, `ul-${i}-${j}`)}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (block.type === 'ol') {
                    return (
                      <ol key={i} className="list-decimal space-y-1.5 pl-6">
                        {(block.items || []).map((item, j) => (
                          <li key={j}>{renderInline(item, `ol-${i}-${j}`)}</li>
                        ))}
                      </ol>
                    );
                  }
                  if (block.type === 'quote') {
                    return (
                      <blockquote
                        key={i}
                        className="rounded-r-xl border-l-4 border-primary-500 bg-surface-50 py-2 pl-4 pr-3 italic dark:bg-surface-800"
                      >
                        {renderInline(block.text || '', `q-${i}`)}
                      </blockquote>
                    );
                  }
                  return <p key={i} className="leading-relaxed">{renderInline(block.text || '', `p-${i}`)}</p>;
                })}
              </article>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
