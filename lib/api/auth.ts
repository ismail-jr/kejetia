// lib/api/auth.ts
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// Builds an Error from a failed response body, appending the backend's
// `details` (e.g. the underlying Postgres error) when present so problems
// like an unmigrated schema are visible instead of a generic message.
function apiError(data: any, fallback: string): Error {
  const base = data?.error || fallback;
  return new Error(data?.details ? `${base}: ${data.details}` : base);
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
    const response = await fetch(`${BACKEND_URL}/api/auth/register/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) throw apiError(data, "Failed to initiate registration");
    return data;
  },

  // Resend a registration OTP (custom nodemailer + Redis flow). This is
  // NOT supabase.auth.resend — registration verification is fully handled
  // by the Express backend, so the resend must hit the same system.
  async resendRegister(email: string): Promise<{ message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/auth/register/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    if (!response.ok) throw apiError(data, "Failed to resend verification code");
    return data;
  },

  // Phase 2: Verify OTP
  async verifyRegister(
    email: string,
    otp: string,
  ): Promise<BackendAuthResponse> {
    const response = await fetch(`${BACKEND_URL}/api/auth/register/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    if (!response.ok) throw apiError(data, "Invalid or expired code");
    return data;
  },

  // Sign in with email + password
  async signIn(email: string, password: string): Promise<BackendAuthResponse> {
    const response = await fetch(`${BACKEND_URL}/api/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password } satisfies SignInPayload),
    });

    const data = await response.json();
    if (!response.ok) throw apiError(data, "Sign in failed");
    return data;
  },

  // Add a secondary role to the signed-in account. No OTP — the email is
  // already verified — but the caller must pass their current session
  // access token so the backend can authenticate the request.
  async addRole(
    role: AddableRole,
    accessToken: string,
  ): Promise<BackendAuthResponse> {
    const response = await fetch(`${BACKEND_URL}/api/auth/role/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ role }),
    });

    const data = await response.json();
    if (!response.ok) throw apiError(data, "Failed to add role");
    return data;
  },
};
