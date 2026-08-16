'use client';

// TEC Titan — the Enterprise Operating Platform (Titan charter, draft). "How do
// organizations operate in the Pi economy?" Titan is the B2B / institutional
// counterpart to Life (Personal OS). Titan COORDINATES; it never holds funds
// (→ tec-payment-service), owns commerce (→ Commerce), mints verification (→ Zone),
// or holds capital (→ FundX). App shell: Home / Modules / Pro / Settings bottom nav.
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePiAuth } from '@yasser172/tec-auth';
import { useMe } from '@/lib-client/hooks/useMe';
import { useTranslation } from '@/lib/i18n';
import { TEC_COLORS } from '@yasser172/tec-ui';
import { InviteCard } from '@/components/referral/InviteCard';
import { TitanPro } from './components/TitanPro';
import { BottomNav, type TitanTab } from './components/BottomNav';
import { SettingsView } from './components/SettingsView';
import {
  ROLE_META, MODULES, STATUS_META, type Module, type Org, type Member,
} from '@/lib/titan/enterprise';

export default function TitanHome() {
  const { user, isLoading } = usePiAuth();
  const me = useMe(); // server-resolved Pi username (Pi Browser hides tec_user from client JS — C-123 §3)
  const { t } = useTranslation();
  const [tab, setTab] = useState<TitanTab>('home');

  const piName = me.username ?? user?.piUsername ?? null;
  const name = piName ? `@${piName}` : '';

  // Real data end-to-end (C-135 §4): the org + team are the caller's OWN data (null/
  // empty unless live); the enterprise-modules map is Titan's definitional catalog.
  const [org,     setOrg]     = useState<Org | null>(null);
  const [team,    setTeam]    = useState<Member[]>([]);
  const [modules, setModules] = useState<Module[]>(MODULES);
  const [source, setSource] = useState<'catalog' | 'live'>('catalog');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res  = await fetch('/api/bff/titan/console', { credentials: 'include' });
        const data = await res.json().catch(() => null);
        if (!alive || !data || !Array.isArray(data.modules)) return;
        setModules(data.modules as Module[]);
        if (data.source === 'live') {
          if (data.org) setOrg(data.org as Org);
          if (Array.isArray(data.team)) setTeam(data.team as Member[]);
          setSource('live');
        }
      } catch { /* keep the definitional catalog; org/team stay unknown */ }
    })();
    return () => { alive = false; };
  }, []);

  const card: React.CSSProperties = {
    background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}22`,
    borderRadius: 12, padding: 14,
  };
  const toneColor = (tone: 'good' | 'mid' | 'low') =>
    tone === 'good' ? TEC_COLORS.success : tone === 'mid' ? TEC_COLORS.gold : TEC_COLORS.subtext;
  const vTone = org?.verification === 'verified' ? TEC_COLORS.success : org?.verification === 'pending' ? TEC_COLORS.gold : TEC_COLORS.subtext;

  const title =
    tab === 'modules' ? t.titan.nav.modules
    : tab === 'pro' ? t.titan.nav.pro
    : tab === 'settings' ? t.titan.nav.settings
    : (isLoading || !name ? t.titan.welcome : t.titan.welcomeName.replace('{name}', name));

  return (
    <main style={{ minHeight: '100vh', background: TEC_COLORS.bg, color: TEC_COLORS.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', padding: '32px 22px calc(96px + env(safe-area-inset-bottom))' }}>
        <header>
          <div style={{ fontSize: 12, letterSpacing: 1, color: TEC_COLORS.subtext, textTransform: 'uppercase' }}>{t.titan.brand}</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: TEC_COLORS.gold, margin: '6px 0 0' }}>{title}</h1>
          {tab === 'home' && (
            <p style={{ fontSize: 14, color: TEC_COLORS.subtext, margin: '6px 0 0', lineHeight: 1.6 }}>{t.titan.subtitle}</p>
          )}
        </header>

        {tab === 'home' && (
          <>
            {/* Org card — the caller's OWN org (verification presented from Zone). */}
            {org ? (
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
            ) : (
              <section style={{ ...card, marginTop: 22, textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.text }}>🏛️ Your organization</div>
                <p style={{ fontSize: 13, color: TEC_COLORS.subtext, margin: '6px auto 0', maxWidth: 460, lineHeight: 1.6 }}>
                  Sign in with Pi to load your organization, team and roles. The enterprise modules tab shows
                  what Titan coordinates and which system owns each capability.
                </p>
              </section>
            )}

            {/* Team + roles — the caller's OWN team (shown only when live) */}
            {team.length > 0 && (
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
            )}

            <p style={{ fontSize: 11, color: TEC_COLORS.subtext, margin: '24px 0 0', lineHeight: 1.5 }}>{t.titan.footer}</p>
          </>
        )}

        {tab === 'modules' && (
          /* Enterprise modules — each names its owning system (definitional catalog). */
          <section style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: TEC_COLORS.text, margin: 0 }}>{t.titan.modulesHeading}</h2>
              {source === 'live' && (
                <span style={{ fontSize: 11, color: TEC_COLORS.subtext, border: `1px solid ${TEC_COLORS.gold}33`, borderRadius: 999, padding: '2px 10px' }}>
                  live console
                </span>
              )}
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
        )}

        {tab === 'pro' && (
          /* Titan Enterprise — real Pi U2A payment (org subscription). */
          <TitanPro />
        )}

        {tab === 'settings' && <SettingsView />}
      </div>

      <BottomNav active={tab} onSelect={setTab} />
    </main>
  );
}
