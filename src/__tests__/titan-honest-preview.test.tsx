/**
 * Titan must say it is a preview, and must not sell what it cannot give.
 *
 * Until 16 Nov 2026 the Pro tab sold "Titan Enterprise" at 25π for "team seats, roles,
 * branches, corporate analytics, and procurement", and on success said those were
 * "unlocked" — while creating an organization was not open at all. The home page spoke
 * of what organizations "manage" in the present tense with nothing saying it was a preview.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ORG_CREATION_OPEN, enterpriseOnSale } from '@/lib/titan/enterprise';
import { en } from '@/lib/i18n/en';
import { ar } from '@/lib/i18n/ar';

vi.mock('@/components/pro/CancelProButton', () => ({ CancelProButton: () => null }));
import { TitanPro } from '@/app/app/components/TitanPro';

describe('Titan Enterprise', () => {
  it('is not on sale while no organization can be created', () => {
    expect(ORG_CREATION_OPEN).toBe(false);
    expect(enterpriseOnSale()).toBe(false);
  });

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ json: async () => ({ data: { subscription: { plan: 'FREE' } } }) }) as never;
  });

  it('the Pro tab offers no payment and says why', async () => {
    render(<TitanPro />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: /upgrade/i })).toBeNull();
    expect(screen.getByText(/not on sale yet/i)).toBeTruthy();
  });
});

describe('the home page says it is a preview', () => {
  it('in every language', () => {
    expect(en.titan.preview).toMatch(/preview/i);
    expect(ar.titan.preview.length).toBeGreaterThan(20);
  });
});
