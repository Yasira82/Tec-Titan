import { describe, it, expect } from 'vitest';
import {
  ORG, TEAM, ROLE_META, MODULES, STATUS_META, getModule,
} from '@/lib/titan/enterprise';

describe('TEC Titan — Enterprise OS console (read-only)', () => {
  it('models an organization (B2B), not an individual user', () => {
    expect(ORG.name.length).toBeGreaterThan(0);
    expect(ORG.members).toBeGreaterThan(1);          // multi-user, not a single user
    expect(ORG.kind.toLowerCase()).toContain('b2b');
  });

  it('has the enterprise role set (Owner/Admin/Finance/Sales/HR) with scopes', () => {
    const roles = new Set(TEAM.map((m) => m.role));
    for (const r of ['Owner', 'Admin', 'Finance', 'Sales', 'HR'] as const) {
      expect(roles.has(r), r).toBe(true);
      expect(ROLE_META[r]?.icon).toBeTruthy();
    }
    for (const m of TEAM) expect(m.scope.length).toBeGreaterThan(0);
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
