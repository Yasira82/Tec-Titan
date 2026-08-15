// TEC Titan — the Enterprise Operating Platform data model (Titan charter, draft).
// "How do organizations operate in the Pi economy?" Titan is the B2B / institutional
// counterpart to Life (Personal OS): it lets an organization manage identity,
// team + roles, operations, commerce, procurement, and reputation on Pi.
//
// BOUNDARY (like Estate): Titan COORDINATES the enterprise; it does NOT own the
// money, commerce, assets, or verification — it presents + orchestrates them for
// an ORG context. Org wallet = a VIEW over tec-payment-service (never a new wallet);
// Enterprise Commerce = a B2B context over Commerce; financing → FundX; verification
// → Zone/tec-kyc-service; reputation → Zone + Connection. This V1 is a curated
// READ-ONLY console; real multi-tenant org data is Phase 1+ (needs a mature system).

// ── Org profile (sample) ────────────────────────────────────────────────────
export type VerificationStatus = 'verified' | 'pending' | 'unverified';

export interface Org {
  name:         string;
  kind:         string;   // Company / University / NGO / Government …
  verification: VerificationStatus;   // from Zone/kyc — presented, never minted
  members:      number;
  branches:     number;
  since:        string;
}

export const ORG: Org = {
  name: 'Acme Pi Trading Co.', kind: 'Company (B2B)', verification: 'verified',
  members: 6, branches: 2, since: '2026',
};

// ── Team roles (multi-user management) ──────────────────────────────────────
export type Role = 'Owner' | 'Admin' | 'Finance' | 'Sales' | 'HR';

export interface Member {
  handle: string;
  role:   Role;
  scope:  string;   // what this role can do (server-enforced later, presented here)
}

export const TEAM: Member[] = [
  { handle: '@founder',  role: 'Owner',   scope: 'Full control · org settings · billing' },
  { handle: '@ops_lead', role: 'Admin',   scope: 'Manage members · workspaces · branches' },
  { handle: '@cfo',      role: 'Finance', scope: 'Org wallet view · payments · procurement approvals' },
  { handle: '@sales1',   role: 'Sales',   scope: 'B2B orders · customers · quotes' },
  { handle: '@people',   role: 'HR',      scope: 'Team + roles (no finance access)' },
];

export const ROLE_META: Record<Role, { icon: string }> = {
  Owner:   { icon: '👑' },
  Admin:   { icon: '🛠️' },
  Finance: { icon: '💰' },
  Sales:   { icon: '📈' },
  HR:      { icon: '🧑‍💼' },
};

// ── Enterprise modules — each names its OWNING system (Titan orchestrates) ──
export interface Module {
  id:        string;
  icon:      string;
  title:     string;
  summary:   string;
  ownedBy:   string;   // the system that actually owns the data/logic
  status:    'live-elsewhere' | 'view' | 'planned';
}

export const MODULES: Module[] = [
  { id: 'verification', icon: '🛡️', title: 'Business Verification', summary: 'Company profile, documents, certificates — the org’s verified status.', ownedBy: 'Zone + tec-kyc-service', status: 'view' },
  { id: 'workspace',    icon: '🏢', title: 'Enterprise Workspace', summary: 'Dashboard, team, permissions, and branches for the organization.', ownedBy: 'Titan (identity via Hub)', status: 'planned' },
  { id: 'org-wallet',   icon: '👛', title: 'Organization Wallet', summary: 'A managed VIEW over the org’s Pi payments — Titan never holds funds.', ownedBy: 'tec-payment-service', status: 'view' },
  { id: 'team',         icon: '👥', title: 'Multi-user Management', summary: 'Owner / Admin / Finance / Sales / HR roles + scoped permissions.', ownedBy: 'Titan + tec-auth (roles)', status: 'planned' },
  { id: 'b2b-commerce', icon: '🤝', title: 'Enterprise Commerce (B2B)', summary: 'Company-to-company buying and selling — a B2B context over Commerce.', ownedBy: 'Commerce', status: 'live-elsewhere' },
  { id: 'procurement',  icon: '📦', title: 'Procurement', summary: 'Purchase requests, suppliers, and tenders for the organization.', ownedBy: 'Titan + Commerce', status: 'planned' },
  { id: 'analytics', icon: '📊', title: 'Corporate Analytics', summary: 'Organization-level reports and insights.', ownedBy: 'Analytics', status: 'live-elsewhere' },
  { id: 'reputation', icon: '⭐', title: 'Business Reputation', summary: 'Trust + reputation derived from real activity and relationships.', ownedBy: 'Zone + Connection', status: 'view' },
  { id: 'financing', icon: '💸', title: 'Enterprise Financing', summary: 'Capital / pooled investment for the organization.', ownedBy: 'FundX', status: 'live-elsewhere' },
  { id: 'assets',       icon: '💎', title: 'Corporate Assets', summary: 'Digital assets / holdings owned by the organization.', ownedBy: 'Assets (tec-asset-service)', status: 'live-elsewhere' },
];

export const getModule = (id: string): Module | null => MODULES.find((m) => m.id === id) ?? null;

export const STATUS_META: Record<Module['status'], { label: string; tone: 'good' | 'mid' | 'low' }> = {
  'live-elsewhere': { label: 'Owned by another app', tone: 'good' },
  view:             { label: 'Managed view',         tone: 'mid' },
  planned:          { label: 'Planned',              tone: 'low' },
};
