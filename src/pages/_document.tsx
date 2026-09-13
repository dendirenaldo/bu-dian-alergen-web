import { Html, Head, Main, NextScript } from 'next/document';

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme')||'system';var r=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.classList.add(r);}catch(e){}})();`;
const LOCALE_INIT_SCRIPT = `(function(){try{var l=localStorage.getItem('locale');if(l==='en'||l==='id'){document.documentElement.lang=l;}}catch(e){}})();`;

export default function Document() {
  return (
    <Html lang="id">
      <Head />
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT + LOCALE_INIT_SCRIPT }} />
        <div
          id="preloader"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '9999px',
                border: '4px solid #e0e7ff',
                borderTopColor: '#4f46e5',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Loading...</p>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('load', function() {
                var preloader = document.getElementById('preloader');
                if (preloader) {
                  preloader.style.transition = 'opacity 0.3s ease-out';
                  preloader.style.opacity = '0';
                  setTimeout(function() { preloader.remove(); }, 300);
                }
              });
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
