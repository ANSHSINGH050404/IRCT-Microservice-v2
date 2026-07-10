const API = process.env.NEXT_PUBLIC_API_URL!;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error ?? body.message ?? "Request failed");
  }

  return body;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  loggedUser: User;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SendOtpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface SendOtpResult {
  message: string;
}

export interface VerifyOtpInput {
  otp: string;
}

export interface VerifyOtpResult {
  message: string;
  user: User;
}

export const auth = {
  login: (data: LoginInput) =>
    request<LoginResult>("/users/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  sendOtp: (data: SendOtpInput) =>
    request<SendOtpResult>("/users/auth/send-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyOtp: (data: VerifyOtpInput) =>
    request<VerifyOtpResult>("/users/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refreshToken: () =>
    request<{ accessToken: string; refreshToken: string }>("/users/auth/refresh-token", {
      method: "POST",
    }),

  getProfile: () =>
    request<{ success: boolean; user: User }>("/users/user/profile"),
};

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}
