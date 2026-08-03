// lib/api/auth.ts
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Fail with a clear, actionable message instead of every fetch() silently
// resolving against "undefined/api/auth/..." (which surfaces as a
// confusing generic network/CORS error with no indication of the cause).
function backendUrl(path: string): string {
  if (!BACKEND_URL) {
    throw new AuthApiError(
      "Authentication service is not configured (missing NEXT_PUBLIC_BACKEND_URL). Contact support.",
    );
  }
  return `${BACKEND_URL}${path}`;
}

export class AuthApiError extends Error {
  code?: string;
  existingRoles?: string[];
  requestedRole?: string;
  status?: number;

  constructor(
    message: string,
    extras?: {
      code?: string;
      existingRoles?: string[];
      requestedRole?: string;
      status?: number;
    },
  ) {
    super(message);
    this.name = "AuthApiError";
    this.code = extras?.code;
    this.existingRoles = extras?.existingRoles;
    this.requestedRole = extras?.requestedRole;
    this.status = extras?.status;
  }
}

function apiError(data: any, fallback: string, status?: number): AuthApiError {
  // The backend intentionally never sends internal error `details` to the
  // client (they could leak schema/implementation info) — just the
  // user-facing `error` message.
  const message = data?.error || fallback;
  return new AuthApiError(message, {
    code: data?.code,
    existingRoles: data?.existingRoles,
    requestedRole: data?.requestedRole,
    status,
  });
}

// Wraps fetch + JSON parsing so failures never bubble up as a raw,
// confusing browser error (e.g. "TypeError: Failed to fetch" from a
// dropped connection/CORS block, or a JSON parse error from an HTML
// error page returned by a proxy) — callers always get an AuthApiError
// with an actionable message.
async function postJson(url: string, body: unknown, headers?: Record<string, string>) {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError(
      "Unable to reach the server. Check your internet connection and try again.",
    );
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new AuthApiError(
        "The server returned an unexpected response. Please try again shortly.",
        { status: response.status },
      );
    }
  }

  return { response, data };
}

export interface RegisterPayload {
  email: string;
  fullName: string;
  studentId: string;
  role: "student" | "provider";
  password: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

// Strictly map the raw dynamic JSON payload coming out of your Express controller
export interface BackendAuthResponse {
  success: boolean;
  session?: {
    access_token: string;
    refresh_token: string;
  };
  user?: {
    id: string;
    email: string;
    roles: ("student" | "provider" | "admin")[];
    activeRole?: "student" | "provider" | "admin";
    active_role?: "student" | "provider" | "admin";
    isAdmin?: boolean;
    is_admin?: boolean;
  };
}

export type AddableRole = "student" | "provider";

export const authService = {
  // Phase 1: Initiate OTP
  async initiateRegister(payload: RegisterPayload) {
    const { response, data } = await postJson(
      backendUrl("/api/auth/register/initiate"),
      payload,
    );
    if (!response.ok)
      throw apiError(data, "Failed to initiate registration", response.status);
    return data;
  },

  // Resend a registration OTP (custom nodemailer + Redis flow). This is
  // NOT supabase.auth.resend — registration verification is fully handled
  // by the Express backend, so the resend must hit the same system.
  async resendRegister(email: string): Promise<{ message: string }> {
    const { response, data } = await postJson(
      backendUrl("/api/auth/register/resend"),
      { email },
    );
    if (!response.ok)
      throw apiError(data, "Failed to resend verification code", response.status);
    return data;
  },

  // Phase 2: Verify OTP
  async verifyRegister(
    email: string,
    otp: string,
  ): Promise<BackendAuthResponse> {
    const { response, data } = await postJson(
      backendUrl("/api/auth/register/verify"),
      { email, otp },
    );
    if (!response.ok)
      throw apiError(data, "Invalid or expired code", response.status);
    return data;
  },

  // Sign in with email + password
  async signIn(email: string, password: string): Promise<BackendAuthResponse> {
    const { response, data } = await postJson(backendUrl("/api/auth/signin"), {
      email,
      password,
    } satisfies SignInPayload);
    if (!response.ok) throw apiError(data, "Sign in failed", response.status);
    return data;
  },

  // Unlock a second role with existing email + password (logged out).
  async addRoleWithCredentials(
    email: string,
    password: string,
    role: AddableRole,
  ): Promise<BackendAuthResponse> {
    const { response, data } = await postJson(
      backendUrl("/api/auth/role/add-with-credentials"),
      { email, password, role },
    );
    if (!response.ok)
      throw apiError(data, "Failed to unlock role", response.status);
    return data;
  },

  // Add a secondary role to the signed-in account. No OTP — the email is
  // already verified — but the caller must pass their current session
  // access token so the backend can authenticate the request.
  async addRole(
    role: AddableRole,
    accessToken: string,
  ): Promise<BackendAuthResponse> {
    const { response, data } = await postJson(
      backendUrl("/api/auth/role/add"),
      { role },
      { Authorization: `Bearer ${accessToken}` },
    );
    if (!response.ok) throw apiError(data, "Failed to add role", response.status);
    return data;
  },
};
