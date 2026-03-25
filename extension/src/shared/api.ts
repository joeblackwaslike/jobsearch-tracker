export type SigninResult =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false; error: string };

export type RefreshResult =
  | { ok: true; access_token: string; refresh_token: string }
  | { ok: false; error: "session_expired" };

export type TrackData = {
  company_name: string;
  position: string;
  url: string;
  /** Board that originated the job view (e.g. "Builtin"), merged from PendingIntent. */
  source?: string;
};

export type TrackResult =
  | { ok: true; application_id: string; company_id: string }
  | { ok: false; error: "duplicate"; application_id: string }
  | { ok: false; error: "unauthorized" }
  | { ok: false; error: "offline_queued" }
  | { ok: false; error: "network_error" }
  | { ok: false; error: string };

export async function signin(
  backendUrl: string,
  email: string,
  password: string,
): Promise<SigninResult> {
  const res = await fetch(`${backendUrl}/api/extension/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (res.ok)
    return { ok: true, access_token: json.access_token, refresh_token: json.refresh_token };
  return { ok: false, error: json.error ?? "Sign in failed" };
}

export async function refresh(backendUrl: string, refreshToken: string): Promise<RefreshResult> {
  const res = await fetch(`${backendUrl}/api/extension/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) return { ok: false, error: "session_expired" };
  const json = await res.json();
  return { ok: true, access_token: json.access_token, refresh_token: json.refresh_token };
}

export async function getGoogleOAuthUrl(
  backendUrl: string,
  redirectTo: string,
  codeChallenge: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const params = new URLSearchParams({ redirect_to: redirectTo, code_challenge: codeChallenge });
    const res = await fetch(`${backendUrl}/api/extension/google-oauth-url?${params}`);
    const json = await res.json();
    if (res.ok) return { ok: true, url: json.url };
    return { ok: false, error: json.error ?? "Failed to get OAuth URL" };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

export async function googleExchange(
  backendUrl: string,
  code: string,
  codeVerifier: string,
): Promise<SigninResult> {
  try {
    const res = await fetch(`${backendUrl}/api/extension/google-exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    });
    const json = await res.json();
    if (res.ok)
      return { ok: true, access_token: json.access_token, refresh_token: json.refresh_token };
    return { ok: false, error: json.error ?? "Exchange failed" };
  } catch {
    return { ok: false, error: "network_error" };
  }
}

export async function track(
  backendUrl: string,
  accessToken: string,
  data: TrackData,
): Promise<TrackResult> {
  try {
    const res = await fetch(`${backendUrl}/api/extension/track`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.ok)
      return { ok: true, application_id: json.application_id, company_id: json.company_id };
    if (res.status === 401) return { ok: false, error: "unauthorized" };
    if (res.status === 409)
      return { ok: false, error: "duplicate", application_id: json.application_id };
    return { ok: false, error: json.error ?? "Unknown error" };
  } catch (_error) {
    // Network error (fetch failed, backend unreachable, etc.)
    return { ok: false, error: "network_error" };
  }
}
