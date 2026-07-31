import {
  MODULES, getModule,
  type Org, type VerificationStatus, type Member, type Role, type Module,
} from './enterprise';

// Server-only Titan backend access (Titan charter). Calls the real Titan read-layer
// (identity-service) via the gateway with the inter-service key, and maps the
// backend rows to the frontend shape. Real data end-to-end (C-135 §4): the org +
// team are the user's OWN data (null/empty unless live — never a fabricated sample);
// the enterprise-modules map is Titan's definitional catalog. NEW-A: the gateway URL
// is server-only (API_GATEWAY_URL) — never shipped to the client.
const GW = process.env.API_GATEWAY_URL ?? '';

const gwHeaders = () => ({
  'Content-Type': 'application/json',
  'x-request-id': crypto.randomUUID(),
  ...(process.env.INTERNAL_SECRET && { 'x-internal-key': process.env.INTERNAL_SECRET }),
});

export function orgFromBackend(o: Record<string, unknown>): Org {
  return {
    name:         String(o.name ?? ''),
    kind:         String(o.kind ?? ''),
    verification: String(o.verification ?? 'unverified').toLowerCase() as VerificationStatus,
    members:      Number(o.members ?? 0),
    branches:     Number(o.branches ?? 0),
    since:        String(o.since ?? ''),
  };
}

export function memberFromBackend(m: Record<string, unknown>): Member {
  return { handle: String(m.handle ?? ''), role: String(m.role ?? '') as Role, scope: String(m.scope ?? '') };
}

export function moduleFromBackend(m: Record<string, unknown>): Module {
  return {
    id:      String(m.module_id ?? ''),
    icon:    String(m.icon ?? ''),
    title:   String(m.title ?? ''),
    summary: String(m.summary ?? ''),
    ownedBy: String(m.owned_by ?? ''),
    status:  String(m.status ?? 'planned') as Module['status'],
  };
}

export interface ResolvedConsole {
  org:     Org | null;      // the caller's OWN org — null unless live
  team:    Member[];        // the caller's OWN team — empty unless live
  modules: Module[];        // Titan's definitional enterprise-modules catalog
  source:  'live' | 'catalog';
}

// The caller's console (own org + team) over the enterprise-modules catalog. Real
// data end-to-end (C-135 §4): org + team are the user's OWN data — null/empty unless
// the live backend returns them (never a fabricated sample). The modules map is
// Titan's definitional catalog (shown always). `owner` from the session (P6).
export async function resolveConsole(owner: string | null): Promise<ResolvedConsole> {
  if (GW) {
    try {
      const res = await fetch(`${GW}/api/identity/titan/console/${encodeURIComponent(owner || '-')}`, {
        headers: gwHeaders(), cache: 'no-store',
      });
      if (res.ok) {
        const data = (await res.json().catch(() => ({})))?.data;
        if (data && Array.isArray(data.modules)) {
          return {
            org:     data.org ? orgFromBackend(data.org as Record<string, unknown>) : null,
            team:    (data.team as Record<string, unknown>[] ?? []).map(memberFromBackend),
            modules: (data.modules as Record<string, unknown>[]).map(moduleFromBackend),
            source:  'live',
          };
        }
      }
    } catch { /* fall through to the definitional catalog (org/team unknown) */ }
  }
  return { org: null, team: [], modules: MODULES, source: 'catalog' };
}

export interface ResolvedModule { module: Module | null; source: 'live' | 'catalog'; }

// One module by id from the definitional catalog — live backend first, local catalog
// otherwise (the modules map is Titan's own product content, not user data). A live
// 404 is authoritative (module: null, source: 'live').
export async function resolveModule(id: string): Promise<ResolvedModule> {
  if (GW) {
    try {
      const res = await fetch(`${GW}/api/identity/titan/module/${encodeURIComponent(id)}`, {
        headers: gwHeaders(), cache: 'no-store',
      });
      if (res.ok) {
        const m = (await res.json().catch(() => ({})))?.data?.module;
        if (m) return { module: moduleFromBackend(m as Record<string, unknown>), source: 'live' };
      }
      if (res.status === 404) return { module: null, source: 'live' };
    } catch { /* fall through to the definitional catalog */ }
  }
  return { module: getModule(id), source: 'catalog' };
}
