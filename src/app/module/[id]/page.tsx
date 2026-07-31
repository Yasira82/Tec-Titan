// TEC Titan — enterprise module detail (Titan charter, draft). Read-only view of
// one enterprise module + the system that actually owns it. Titan orchestrates
// the org context; the owning system owns the data/logic (payment-service,
// Commerce, Zone, FundX, Assets, Analytics, Connection).
import Link from 'next/link';
import type { Metadata } from 'next';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { getModule, STATUS_META } from '@/lib/titan/enterprise';
import { resolveModule } from '@/lib/titan/server';

// Rendered dynamically from the live Titan read-layer (resolveModule does a no-store
// gateway fetch); the enterprise-modules map is Titan's definitional catalog, with
// the local catalog as the offline copy. A live 404 is authoritative → notFound().
export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
  const { id } = await params;
  const m = getModule(id);
  return {
    title:       m ? `${m.title} — TEC Titan` : 'TEC Titan — Module',
    description: m ? m.summary : 'A TEC Titan enterprise module.',
  };
}

export default async function ModulePage(
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Resolve from the live Titan read-layer; fall back to the curated sample so the
  // page never 500s. A live 404 is authoritative → "not found".
  const { module: m } = await resolveModule(id);

  const wrap: React.CSSProperties = {
    minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text,
    padding: '32px 22px', fontFamily: 'system-ui, -apple-system, sans-serif',
  };
  const inner: React.CSSProperties = { maxWidth: 640, margin: '0 auto' };

  if (!m) {
    return (
      <main style={wrap}>
        <div style={inner}>
          <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none' }}>← Enterprise console</Link>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: TEC_COLORS.text, marginTop: 16 }}>Module not found</h1>
          <p style={{ fontSize: 13, color: TEC_COLORS.subtext }}>No module <code>{id}</code> in the console.</p>
        </div>
      </main>
    );
  }

  const st = STATUS_META[m.status];
  const tone = st.tone === 'good' ? TEC_COLORS.success : st.tone === 'mid' ? TEC_COLORS.gold : TEC_COLORS.subtext;

  return (
    <main style={wrap}>
      <div style={inner}>
        <Link href="/app" style={{ fontSize: 13, color: TEC_COLORS.gold, textDecoration: 'none' }}>← Enterprise console</Link>

        <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: TEC_COLORS.gold, margin: 0 }}>{m.icon} {m.title}</h1>
          <span style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', color: tone, border: `1px solid ${tone}55`, borderRadius: 999, padding: '3px 10px' }}>{st.label}</span>
        </div>

        <p style={{ fontSize: 15, color: TEC_COLORS.text, margin: '14px 0 0', lineHeight: 1.6 }}>{m.summary}</p>

        <div style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`, borderRadius: 12, padding: 14, marginTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: TEC_COLORS.text }}>Owning system</div>
          <div style={{ fontSize: 12, color: TEC_COLORS.gold, marginTop: 4 }}>{m.ownedBy}</div>
          <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 8, lineHeight: 1.5 }}>
            {m.status === 'live-elsewhere'
              ? 'This capability is owned and run by another TEC app. Titan presents it in the enterprise (org) context and routes you there — it does not re-implement it.'
              : m.status === 'view'
              ? 'Titan presents a managed VIEW over the owning system for the organization — it never owns the underlying data (e.g. funds stay in tec-payment-service).'
              : 'Planned for a future Titan phase — organizations need a mature platform first. Presented here so the enterprise scope is explicit.'}
          </div>
        </div>

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '20px 0 0', lineHeight: 1.5 }}>
          Titan is the Enterprise OS — it coordinates identity, team/roles, and org
          operations, and orchestrates the owning apps. It never holds funds, owns
          commerce/assets, or mints verification.
        </p>
      </div>
    </main>
  );
}
