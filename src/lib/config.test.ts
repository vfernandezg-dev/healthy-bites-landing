import { describe, expect, it } from 'vitest';

import { normalizeBaseUrl } from './config';

describe('normalizeBaseUrl', () => {
  const fallback = 'https://fallback.example.com';

  it('usa el valor configurado sin barras finales', () => {
    expect(normalizeBaseUrl('http://localhost:8090/api/v1/', fallback)).toBe(
      'http://localhost:8090/api/v1',
    );
  });

  it('usa el valor de respaldo cuando la variable no existe o está vacía', () => {
    expect(normalizeBaseUrl(undefined, fallback)).toBe(fallback);
    expect(normalizeBaseUrl('   ', fallback)).toBe(fallback);
  });
});
