import { NextResponse } from 'next/server';
import { ORG, TEAM, MODULES } from '@/lib/titan/enterprise';

// GET /api/bff/titan/console — the enterprise console (Titan charter, draft).
// Titan is the Enterprise OS: it coordinates the org (identity, team/roles,
// operations) and orchestrates the OWNING apps. This V1 serves a curated
// read-only SAMPLE (source:'sample'); when live, it proxies the caller's OWN
// organization (identity from the session cookie, never a param — P6): org
// profile + verification (Zone), team + roles (tec-auth), and a wallet VIEW
// (tec-payment-service). Titan never owns funds/commerce/assets/verification.
export function GET() {
  return NextResponse.json(
    { source: 'sample', org: ORG, team: TEAM, modules: MODULES },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}
