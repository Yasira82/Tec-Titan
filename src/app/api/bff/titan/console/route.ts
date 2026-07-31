import { NextRequest, NextResponse } from 'next/server';
import { resolveConsole } from '@/lib/titan/server';

// GET /api/bff/titan/console — the enterprise console (Titan charter, draft).
// Titan is the Enterprise OS: it coordinates the org (identity, team/roles,
// operations) and orchestrates the OWNING apps. Proxies the caller's OWN
// organization from the backend (identity from the `tec_user` session cookie
// server-side — NEVER a param, P6): org profile + verification (Zone), team + roles
// (tec-auth), and the module map. Returns source:'live'; falls back to the curated
// definitional catalog (org/team null) if the backend is unreachable — never a fabricated org (C-135 §4). Titan never owns
// funds/commerce/assets/verification. NEW-A: gateway URL is server-only.
function ownerFromSession(req: NextRequest): string | null {
  try {
    const raw = req.cookies.get('tec_user')?.value ?? '';
    if (!raw) return null;
    let u: Record<string, unknown>;
    try { u = JSON.parse(raw); } catch { u = JSON.parse(decodeURIComponent(raw)); }
    const owner = (u.piUsername ?? u.username) as string | undefined;
    return owner && owner.trim() ? owner : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const owner = ownerFromSession(req);
  const { org, team, modules, source } = await resolveConsole(owner);
  return NextResponse.json(
    { source, org, team, modules },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}
