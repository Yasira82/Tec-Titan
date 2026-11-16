import { describe, it, expect } from 'vitest';
import {
  ROLE_META, MODULES, STATUS_META, getModule,
} from '@/lib/titan/enterprise';
import * as enterprise from '@/lib/titan/enterprise';

describe('TEC Titan — Enterprise OS console (read-only)', () => {
  // The org and team are the person's own data and come only from the backend
  // (server.ts). A sample org ("Acme Pi Trading Co.") and team lived here until
  // 16 Nov 2026 — unused, and one import away from being shown as real.
  it('ships no sample organization or team', () => {
    expect('ORG' in enterprise).toBe(false);
    expect('TEAM' in enterprise).toBe(false);
  });

  it('has the enterprise role set (Owner/Admin/Finance/Sales/HR)', () => {
    for (const r of ['Owner', 'Admin', 'Finance', 'Sales', 'HR'] as const) {
      expect(ROLE_META[r]?.icon, r).toBeTruthy();
    }
  });

  it('every module names the OWNING system (Titan orchestrates, never owns)', () => {
    for (const m of MODULES) {
      expect(m.ownedBy.length).toBeGreaterThan(0);
      expect(STATUS_META[m.status]).toBeTruthy();
    }
  });

  it('funds + commerce + verification are owned elsewhere (boundary)', () => {
    const wallet = getModule('org-wallet');
    expect(wallet?.ownedBy).toContain('payment-service');   // never a new wallet
    expect(getModule('b2b-commerce')?.ownedBy.toLowerCase()).toContain('commerce');
    expect(getModule('verification')?.ownedBy.toLowerCase()).toContain('zone');
    expect(getModule('financing')?.ownedBy.toLowerCase()).toContain('fundx');
  });

  it('getModule resolves by id and fails closed for an unknown id', () => {
    expect(getModule('verification')?.title).toBe('Business Verification');
    expect(getModule('nope')).toBeNull();
  });

  it('covers the enterprise scope (verification, workspace, wallet, team, procurement)', () => {
    const ids = new Set(MODULES.map((m) => m.id));
    for (const id of ['verification', 'workspace', 'org-wallet', 'team', 'procurement', 'analytics', 'reputation']) {
      expect(ids.has(id), id).toBe(true);
    }
  });
});
