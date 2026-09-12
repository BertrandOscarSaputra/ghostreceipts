const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088";

export interface User {
  id: string;
  username: string;
  email?: string;
  wallet_address?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AgreementSummary {
  id: string;
  creator_id: string;
  participant_id: string;
  status: "Pending" | "Active" | "RevisionPending" | "CompletionPending" | "Completed" | "Rejected" | "Cancelled";
  current_version: number;
  title: string;
  amount?: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface AgreementVersion {
  id: string;
  agreement_id: string;
  version_number: number;
  title: string;
  description?: string;
  amount?: number;
  deadline?: string;
  created_by: string;
  created_at: string;
}

export interface AgreementEvent {
  id: string;
  agreement_id: string;
  actor_id: string;
  event_type: string;
  metadata?: Record<string, unknown>;
  tx_hash?: string;
  created_at: string;
}

export interface Agreement {
  id: string;
  creator_id: string;
  participant_id: string;
  status: "Pending" | "Active" | "RevisionPending" | "CompletionPending" | "Completed" | "Rejected" | "Cancelled";
  current_version: number;
  on_chain_id?: string;
  on_chain_tx_hash?: string;
  created_at: string;
  updated_at: string;
}

export interface AgreementDetailResponse {
  agreement: Agreement;
  current_version_detail: AgreementVersion;
  versions: AgreementVersion[];
  events: AgreementEvent[];
}

export interface DiffValue<T> {
  old: T;
  new: T;
}

export interface AgreementDiff {
  from_version: number;
  to_version: number;
  title?: DiffValue<string>;
  description?: DiffValue<string | null>;
  amount?: DiffValue<number | null>;
  deadline?: DiffValue<string | null>;
  price_trend: "Increased" | "Decreased" | "Unchanged";
  deadline_trend: "Extended" | "Shortened" | "Unchanged";
  has_changes: boolean;
}

export interface OnChainTxSummary {
  event_type: string;
  tx_hash: string;
  timestamp: string;
}

export interface OnChainStatusResponse {
  agreement_id: string;
  on_chain_id: string;
  current_version: number;
  status: string;
  contract_address: string;
  network: string;
  explorer_url: string;
  transactions: OnChainTxSummary[];
}

// Session storage keys
export const TOKEN_KEY = "ghostreceipt_token";
export const USER_KEY = "ghostreceipt_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: User): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Authentication endpoints
export async function login(identifier: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed. Please check your username/email and password.");
  }
  const data: AuthResponse = await res.json();
  saveSession(data.token, data.user);
  return data;
}

export async function register(username: string, password: string, email?: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      email: email?.trim() || undefined,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Registration failed. Please check your inputs.");
  }
  const data: AuthResponse = await res.json();
  saveSession(data.token, data.user);
  return data;
}

export async function getMe(token?: string): Promise<User> {
  const authToken = token || getStoredToken();
  if (!authToken) throw new Error("No active session found");
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) {
    clearSession();
    throw new Error("Session expired. Please sign in again.");
  }
  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch(`${API_URL}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(username: string, wallet_address?: string, email?: string): Promise<User> {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, wallet_address, email }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create user");
  }
  return res.json();
}

export async function getAgreements(userId?: string): Promise<AgreementSummary[]> {
  const url = userId ? `${API_URL}/agreements?user_id=${userId}` : `${API_URL}/agreements`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch agreements");
  return res.json();
}

export async function getAgreement(id: string): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}`);
  if (!res.ok) throw new Error("Failed to fetch agreement details");
  return res.json();
}

export async function createAgreement(data: {
  creator_id: string;
  participant_id: string;
  title: string;
  description?: string;
  amount?: number;
  deadline?: string;
}): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create agreement");
  }
  return res.json();
}

export async function acceptAgreement(id: string, actor_id: string): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to accept agreement");
  }
  return res.json();
}

export async function rejectAgreement(id: string, actor_id: string): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to reject agreement");
  }
  return res.json();
}

export async function proposeRevision(
  id: string,
  data: {
    actor_id: string;
    title: string;
    description?: string;
    amount?: number;
    deadline?: string;
  }
): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}/revisions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to propose revision");
  }
  return res.json();
}

export async function acceptRevision(id: string, version: number, actor_id: string): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}/revisions/${version}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to accept revision");
  }
  return res.json();
}

export async function rejectRevision(id: string, version: number, actor_id: string): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}/revisions/${version}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to reject revision");
  }
  return res.json();
}

export async function requestCompletion(id: string, actor_id: string): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}/completion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to request completion");
  }
  return res.json();
}

export async function confirmCompletion(id: string, actor_id: string): Promise<AgreementDetailResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}/completion/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ actor_id }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to confirm completion");
  }
  return res.json();
}

export async function getDiff(id: string, from?: number, to?: number): Promise<AgreementDiff> {
  let url = `${API_URL}/agreements/${id}/diff`;
  const params = new URLSearchParams();
  if (from !== undefined) params.set("from", from.toString());
  if (to !== undefined) params.set("to", to.toString());
  if (params.toString()) url += `?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch revision diff");
  return res.json();
}

export async function getOnChainStatus(id: string): Promise<OnChainStatusResponse> {
  const res = await fetch(`${API_URL}/agreements/${id}/onchain`);
  if (!res.ok) throw new Error("Failed to fetch on-chain status");
  return res.json();
}
