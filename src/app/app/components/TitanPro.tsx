'use client';

// Titan Enterprise — the monetization surface (Enterprise/organization plan). A
// real Pi User-to-App payment; also satisfies the Pi Portal "Process a
// Transaction" step. ADR-007 dual-mode: Hub navigation → Mode 1 (Hub modal);
// standalone → Mode 2 (createU2APayment). Approves under PI_API_KEY_TITAN
// (never the default Hub key — C-12 §11).
import { useEffect, useState } from 'react';
import { TEC_COLORS } from '@yasser172/tec-ui';
import {
  isHubNavigation,
  redirectToHubPayment,
  createPaymentRecord,
  createU2APayment,
} from '@/lib/pi-payment';

const PRICE   = 25;                        // π / month
// The PLATFORM plan this buys is PRO. "Titan Enterprise" stays the product name
// shown to the buyer — it is this app's own tier — but the machine key must name
// the plan commerce will actually grant, and that is not the same word.
//
// It used to read `titan_enterprise_monthly`, which commerce resolves to the
// ENTERPRISE plan. ENTERPRISE carries a 50π activation floor (a dust payment
// tagged `_enterprise_monthly` must not buy a 50π tier), so every 25π purchase
// here was REJECTED and recorded PAST_DUE: the Pi moved and nothing was granted.
//
// Raising the price to 50π would have cleared the floor and been the wrong fix.
// Nothing on this platform enforces ENTERPRISE: every app reads
// `plan === 'PRO' || plan === 'ENTERPRISE'` into one boolean, and the extra
// features listed against ENTERPRISE are display strings with no mechanism
// behind them. Selling a tier the platform cannot enforce is the same failure
// as selling one that never activates — the buyer pays more and receives the
// identical entitlement. ENTERPRISE becomes sellable when per-tier capability
// gating exists (SYSTEM, C-110 P0-1), and that is an ADR, not a rename.
const ITEM_ID = 'titan_pro_monthly';
const MEMO    = 'TEC Titan — Enterprise (1 month)';

const asText = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.message === 'string') return o.message;
    if (typeof o.error === 'string')   return o.error;
    try { return JSON.stringify(v); } catch { return 'Payment failed.'; }
  }
  return v == null ? '' : String(v);
};

type Status = 'idle' | 'creating' | 'paying' | 'success' | 'error';

export function TitanPro() {
  const [piReady, setPiReady] = useState(false);
  const [status,  setStatus]  = useState<Status>('idle');
  const [message, setMessage] = useState('');

  // Reflect the real subscription (activated by commerce-service when a Pro payment
  // completes). Pro ONLY while the period is live — no auto-renewal / no downgrade job.
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/bff/subscription', { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json()).catch(() => ({}))
      .then((j: Record<string, unknown>) => {
        const d = (j?.data ?? j ?? {}) as Record<string, unknown>;
        const s = ((d?.subscription ?? d) ?? {}) as Record<string, unknown>;
        const end  = typeof s.current_period_end === 'string' ? new Date(s.current_period_end) : null;
        const live = s.isActive !== false && !(s.isExpired === true || (end !== null && end.getTime() < Date.now()));
        const plan = String(s.plan ?? '').toUpperCase();
        setIsSubscribed(live && (plan === 'PRO' || plan === 'ENTERPRISE'));
        // Renewal signal (Pi Pro is one-time, no auto-renewal) — commerce sends
        // daysRemaining; fall back to the period end. Drives a re-subscribe nudge.
        const days = typeof s.daysRemaining === 'number'
          ? s.daysRemaining
          : end ? Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000)) : null;
        setDaysRemaining(days);
      })
      .catch(() => {});
  }, []);


  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ((window as { __TEC_PI_READY?: boolean }).__TEC_PI_READY) { setPiReady(true); return; }
    const h = () => setPiReady(true);
    window.addEventListener('tec-pi-ready', h, { once: true });
    return () => window.removeEventListener('tec-pi-ready', h);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p  = new URLSearchParams(window.location.search);
    const st = p.get('payment_status');
    if (!st) return;
    if (st === 'success') setStatus('success');
    else if (st === 'error') { setStatus('error'); setMessage('Payment did not complete. Please try again.'); }
    window.history.replaceState({}, '', '/app');
  }, []);

  const handleUpgrade = async () => {
    if (status === 'creating' || status === 'paying') return;

    // ADR-007 (C-76): check Hub navigation FIRST — before any Pi SDK call.
    if (isHubNavigation() || (window as { __TEC_PI_FOREIGN_SESSION?: boolean }).__TEC_PI_FOREIGN_SESSION
        || !(window as { Pi?: unknown }).Pi || !piReady) {
      redirectToHubPayment({ amount: PRICE, itemId: ITEM_ID, memo: MEMO });
      return;
    }

    setStatus('creating');
    setMessage('');
    try {
      const internalId = await createPaymentRecord(PRICE, ITEM_ID, MEMO);
      if (!internalId) {
        setStatus('error');
        setMessage('Could not start the payment. Please sign in again and retry.');
        return;
      }
      setStatus('paying');
      const result = await createU2APayment(PRICE, MEMO, { item_id: ITEM_ID, plan: 'titan_pro' }, internalId);
      if (result.success && result.status === 'completed') {
        setStatus('success');
      } else if (result.status === 'cancelled') {
        setStatus('idle');
      } else {
        setStatus('error');
        setMessage(asText(result.message) || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(asText(err) || 'Payment failed. Please try again.');
    }
  };

  const card: React.CSSProperties = {
    background:   TEC_COLORS.surface,
    border:       `1px solid ${TEC_COLORS.gold}55`,
    borderRadius: 16,
    padding:      20,
    marginTop:    24,
  };

  if (isSubscribed) {
    return (
      <div style={{ background: TEC_COLORS.surface, border: `1px solid ${TEC_COLORS.gold}55`, borderRadius: 16, padding: 20, marginTop: 24 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.gold }}>★ You’re on Pro</div>
        <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 6 }}>
          Your subscription is active. Thanks for supporting TEC.
        </div>
        {typeof daysRemaining === 'number' && (
          <div style={{ fontSize: 12, fontWeight: daysRemaining <= 7 ? 700 : 600, color: daysRemaining <= 7 ? TEC_COLORS.gold : TEC_COLORS.subtext, marginTop: 8 }}>
            {daysRemaining <= 7 ? '⏳ ' : ''}Expires in {daysRemaining} day{daysRemaining === 1 ? '' : 's'}{daysRemaining <= 7 ? ' — re-subscribe to keep Pro (one-time monthly, no auto-renewal).' : '.'}
          </div>
        )}
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div style={{ ...card, borderColor: `${TEC_COLORS.success}66` }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.success }}>✅ Titan Enterprise active</div>
        <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 6 }}>
          Payment received. Team seats, branches, and corporate analytics unlocked 🏛️.
        </div>
      </div>
    );
  }

  const busy = status === 'creating' || status === 'paying';

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: TEC_COLORS.gold }}>🏛️ Titan Enterprise</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: TEC_COLORS.text }}>
          {PRICE}π<span style={{ fontSize: 12, color: TEC_COLORS.subtext, fontWeight: 600 }}> / month</span>
        </div>
      </div>
      <div style={{ fontSize: 12, color: TEC_COLORS.subtext, marginTop: 8, lineHeight: 1.5 }}>
        For organizations — team seats, roles, branches, corporate analytics, and
        procurement. Titan brings your organization together in one place — funds, commerce, and
        verification are handled securely by their dedicated systems.
      </div>

      <button
        onClick={() => { void handleUpgrade(); }}
        disabled={busy}
        style={{
          marginTop: 14, width: '100%', padding: '12px 16px', borderRadius: 12,
          background: busy ? '#333' : `linear-gradient(135deg, ${TEC_COLORS.gold}, ${TEC_COLORS.goldDark})`,
          color: busy ? '#888' : '#0a0800',
          border: 'none', fontSize: 14, fontWeight: 800,
          cursor: busy ? 'not-allowed' : 'pointer',
        }}
      >
        {status === 'creating' ? 'Preparing…'
          : status === 'paying' ? 'Confirm in Pi…'
          : `Upgrade — ${PRICE}π / month`}
      </button>

      {status === 'error' && (
        <div style={{ fontSize: 12, color: TEC_COLORS.error, marginTop: 10 }}>{message}</div>
      )}
    </div>
  );
}
