import { describe, expect, test } from 'vitest';
import { asArray, asObject, parseJsonField } from '@/lib/json';

describe('lib/json (MariaDB LONGTEXT)', () => {
  test('parseJsonField meneruskan objek/array, mem-parse string, fallback aman', () => {
    const obj = { a: 1 };
    expect(parseJsonField(obj, {})).toBe(obj);
    expect(parseJsonField('{"x":1}', {})).toEqual({ x: 1 });
    expect(parseJsonField('[1,2]', [])).toEqual([1, 2]);
    expect(parseJsonField('bukan-json', { d: 1 })).toEqual({ d: 1 });
    expect(parseJsonField('', 'fb')).toBe('fb');
    expect(parseJsonField(null, 'fb')).toBe('fb');
  });

  test('asArray/asObject menolak bentuk yang salah', () => {
    expect(asArray('[{"n":"Susu"}]')).toEqual([{ n: 'Susu' }]);
    expect(asArray('{"a":1}', ['fb'])).toEqual(['fb']);
    expect(asArray(null)).toEqual([]);
    expect(asObject('{"model_name":"bert"}')).toEqual({ model_name: 'bert' });
    expect(asObject('[1]')).toEqual({});
    expect(asObject(null)).toEqual({});
  });

  test('mensimulasikan payload MariaDB: string di dalam item', () => {
    const item = {
      correctedAllergens: '[{"name":"Susu","severity":"high","confidence":0.9}]',
      detection: { rawModelOutput: '{"model_name":"bert"}' },
    } as any;
    expect(asArray(item.correctedAllergens)).toHaveLength(1);
    expect(asObject(item.detection.rawModelOutput)?.model_name).toBe('bert');
  });
});
