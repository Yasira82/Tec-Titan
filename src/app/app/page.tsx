'use client';

// TEC Titan — the Enterprise Operating Platform (Titan charter, draft). "How do
// organizations operate in the Pi economy?" Titan is the B2B / institutional
// counterpart to Life (Personal OS): an org manages identity, team + roles,
// operations, commerce, procurement, and reputation on Pi. Titan COORDINATES;
// it never holds funds (→ tec-payment-service), owns commerce (→ Commerce),
// mints verification (→ Zone), or holds capital (→ FundX). This V1 is a curated
// read-only console served by /api/bff/titan/console; real multi-tenant org
// data is Phase 1+.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePiAuth } from '@yasser172/tec-auth';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { TitanPro } from './components/TitanPro';
import {
  ORG, TEAM, ROLE_META, MODULES, STATUS_META, type Module, type Org, type Member,
} from '@/lib/titan/enterprise';

export default function TitanHome() {
  const { user, isLoading } = usePiAuth();
  const name = user?.piUsername ? `@${user.piUsername}` : 'there';

  // The caller's OWN console (org + team) + the global module map — fetched from the
  // BFF (identity from the session cookie, P6), falling back to the curated sample so
  // the console is never blank.
  const [org,     setOrg]     = useState<Org>(ORG);
  const [team,    setTeam]    = useState<Member[]>(TEAM);
  const [modules, setModules] = useState<Module[]>(MODULES);
  const [source, setSource] = useState<'sample' | 'live'>('sample');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res  = await fetch('/api/bff/titan/console', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!alive || !data || !Array.isArray(data.modules)) return;
        if (data.org) setOrg(data.org as Org);
        if (Array.isArray(data.team)) setTeam(data.team as Member[]);
        setModules(data.modules as Module[]);
        setSource(data.source === 'live' ? 'live' : 'sample');
      } catch { /* keep the sample console */ }
    })();
    return () => { alive = false; };
  }, []);

  const card: React.CSSProperties = {
    background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`,
    borderRadius: 12, padding: 14,
  };
  const toneColor = (tone: 'good' | 'mid' | 'low') =>
    tone === 'good' ? TEC_COLORS.success : tone === 'mid' ? TEC_COLORS.gold : TEC_COLORS.subtext;
  const vTone = org.verification === 'verified' ? TEC_COLORS.success : org.verification === 'pending' ? TEC_COLORS.gold : TEC_COLORS.subtext;

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, padding: '32px 22px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>TEC Titan · Enterprise OS</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>
            {isLoading ? 'Enterprise console' : `Welcome, ${name}`}
          </h1>
          <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>
            The Enterprise Operating Platform of TEC — organizations manage identity,
            team, operations, commerce, and reputation on Pi. Life is the Personal OS;
            <strong style={{ color: TEC_COLORS.text }}> Titan is the Enterprise OS.</strong>
          </p>
        </header>

        {/* Org card — a read-only sample org (verification presented from Zone). */}
        <section style={{ ...card, marginTop: 22 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: TEC_COLORS.text }}>🏛️ {org.name}</div>
              <div style={{ fontSize: 12, color: TEC_COLORS.gold, marginTop: 2 }}>{org.kind} · {org.members} members · {org.branches} branches · since {org.since}</div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap', color: vTone, border: `1px solid ${vTone}55`, borderRadius: 999, padding: '3px 10px' }}>
              {org.verification === 'verified' ? '✅ Zone Verified' : org.verification === 'pending' ? 'Verification pending' : 'Unverified'}
            </span>
          </div>
        </section>

        {/* Titan Enterprise — real Pi U2A payment (org subscription). */}
        <TitanPro />

        {/* Team + roles */}
        <section style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Team &amp; roles</h2>
          <p style={{ fontSize: 12, color: TEC_COLORS.subtext, margin: '6px 0 12px', lineHeight: 1.5 }}>
            Multi-user management — role scopes are enforced server-side (tec-auth) at
            runtime; presented here read-only.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            {team.map((m) => (
              <div key={m.handle} style={card}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: TEC_COLORS.text }}>{m.handle}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: TEC_COLORS.gold, border: `1px solid ${TEC_COLORS.gold}44`, borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>{ROLE_META[m.role].icon} {m.role}</span>
                </div>
                <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 5, lineHeight: 1.5 }}>{m.scope}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Enterprise modules — each names its owning system. */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>Enterprise modules</h2>
            <span style={{ fontSize: 11, color: TEC_COLORS.subtext, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 999, padding: '2px 10px' }}>
              {source === 'live' ? 'live console' : 'sample console'}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10, marginTop: 12 }}>
            {modules.map((mod) => {
              const st = STATUS_META[mod.status];
              return (
                <Link key={mod.id} href={`/module/${mod.id}`} style={{ ...card, display: 'block', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: TEC_COLORS.text }}>{mod.icon} {mod.title}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, whiteSpace: 'nowrap', color: toneColor(st.tone), border: `1px solid ${toneColor(st.tone)}55`, borderRadius: 999, padding: '2px 7px' }}>{st.label}</span>
                  </div>
                  <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 5, lineHeight: 1.5 }}>{mod.summary}</div>
                  <div style={{ fontSize: 11, color: TEC_COLORS.gold, marginTop: 6 }}>owner: {mod.ownedBy}</div>
                </Link>
              );
            })}
          </div>
        </section>

        <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '24px 0 0', lineHeight: 1.5 }}>
          Titan coordinates the organization; it does NOT hold funds (→ tec-payment-service),
          own commerce (→ Commerce), hold capital (→ FundX), own assets (→ Assets), or mint
          verification (→ Zone/kyc). The org wallet is a managed VIEW, never a new wallet.
        </p>
      </div>
    </main>
  );
}
