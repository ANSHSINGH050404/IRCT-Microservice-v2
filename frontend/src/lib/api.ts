const API = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminAccessToken") : null;
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(adminToken && !token ? { Authorization: `Bearer ${adminToken}` } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? body.message ?? "Request failed");
  return body as T;
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

export interface Station {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface Seat {
  id: string;
  seatNumber: string;
  seatType: "AC" | "Sleeper" | "Seater";
  pricePaise: number;
  price?: number;
}

export interface Train {
  id: string;
  name: string;
  number: string;
  coachName: string;
  totalSeats: number;
  seats: Seat[];
  createdAt: string;
  updatedAt: string;
}

export interface RouteStation {
  id: string;
  stationId: string;
  station: Station;
  stopNumber: number;
  arrivalTime: string | null;
  departureTime: string | null;
}

export interface Route {
  id: string;
  trainId: string;
  train: Train;
  routeStations: RouteStation[];
  createdAt: string;
  updatedAt: string;
}

export interface Schedule {
  id: string;
  trainId: string;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  train: Train;
  createdAt: string;
  updatedAt: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
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

export interface SendOtpInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyOtpInput { otp: string }
export interface VerifyOtpResult { message: string; user: User }

export interface Journey {
  id: string;
  journeyDate: string;
  departureTime: string;
  arrivalTime: string;
  train: Pick<Train, "id" | "name" | "number">;
  fromStation: Station;
  toStation: Station;
  availableSeatCount: number;
  fares: number[];
}

export interface BookingPassengerInput {
  name: string;
  age: number;
  gender: "MALE" | "FEMALE" | "OTHER";
  phone: string;
  seatId: string;
}

export interface Booking {
  id: string;
  pnr: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  paymentStatus: string;
  totalAmountPaise: number;
  totalAmount: number;
  createdAt: string;
  cancelledAt: string | null;
  expiresAt: string | null;
  journey: {
    id: string;
    journeyDate: string;
    departureTime: string;
    arrivalTime: string;
    train: Pick<Train, "id" | "name" | "number">;
    fromStation: Station;
    toStation: Station;
  };
  passengers: Array<BookingPassengerInput & { id: string; farePaise: number; seat: Seat }>;
}

export const auth = {
  login: (data: LoginInput) => request<LoginResult>("/users/auth/login", { method: "POST", body: JSON.stringify(data) }),
  sendOtp: (data: SendOtpInput) => request<{ message: string }>("/users/auth/send-otp", { method: "POST", body: JSON.stringify(data) }),
  verifyOtp: (data: VerifyOtpInput) => request<VerifyOtpResult>("/users/auth/verify-otp", { method: "POST", body: JSON.stringify(data) }),
  refreshToken: () => request<{ accessToken: string; refreshToken: string }>("/users/auth/refresh-token", { method: "POST" }),
  getProfile: () => request<{ success: boolean; user: User }>("/users/user/profile"),
};

export const searchApi = {
  stations: (q: string) => request<Station[]>(`/search/stations?q=${encodeURIComponent(q)}`),
  trains: (q: string) => request<Train[]>(`/search/trains?q=${encodeURIComponent(q)}`),
  routes: (q: string) => request<Route[]>(`/search/routes?q=${encodeURIComponent(q)}`),
  schedules: (q: string) => request<Schedule[]>(`/search/schedules?q=${encodeURIComponent(q)}`),
};

export const adminAuth = {
  login: (data: LoginInput) => request<{ accessToken: string; refreshToken: string; admin: Admin }>("/admin/auth/login", { method: "POST", body: JSON.stringify(data) }),
  getProfile: () => request<Admin>("/admin/auth/profile"),
  logout: () => request<{ message: string }>("/admin/auth/logout", { method: "POST" }),
};

export const adminApi = {
  getStations: () => request<Station[]>("/admin/stations"),
  getStation: (id: string) => request<Station>(`/admin/stations/${id}`),
  createStation: (data: { name: string; code: string; city: string; state: string }) => request<Station>("/admin/stations", { method: "POST", body: JSON.stringify(data) }),
  getTrains: () => request<Train[]>("/admin/trains"),
  getTrain: (id: string) => request<Train>(`/admin/trains/${id}`),
  createTrain: (data: { name: string; number: string; coachName?: string; totalSeats: number }) => request<Train>("/admin/trains", { method: "POST", body: JSON.stringify(data) }),
  getRoutes: () => request<Route[]>("/admin/routes"),
  getRoute: (id: string) => request<Route>(`/admin/routes/${id}`),
  createRoute: (data: { trainId: string; stations: { stationId: string; stopNumber: number; arrivalTime?: string; departureTime?: string }[] }) => request<Route>("/admin/routes", { method: "POST", body: JSON.stringify(data) }),
  getSchedules: () => request<Schedule[]>("/admin/schedules"),
  getSchedule: (id: string) => request<Schedule>(`/admin/schedules/${id}`),
  createSchedule: (data: { trainId: string; journeyDate: string; departureTime: string; arrivalTime: string }) => request<Schedule>("/admin/schedules", { method: "POST", body: JSON.stringify(data) }),
};

export const bookingApi = {
  journeys: (input: { fromStationId: string; toStationId: string; journeyDate: string }) => {
    const query = new URLSearchParams(input).toString();
    return request<{ journeys: Journey[] }>(`/booking/journeys?${query}`);
  },
  availability: (scheduleId: string, fromStationId: string, toStationId: string) => {
    const query = new URLSearchParams({ fromStationId, toStationId }).toString();
    return request<{ scheduleId: string; expiresInMinutes: number; seats: Seat[] }>(`/booking/schedules/${scheduleId}/availability?${query}`);
  },
  checkout: (input: { scheduleId: string; fromStationId: string; toStationId: string; passengers: BookingPassengerInput[] }) =>
    request<{ booking: Booking; payment: { orderId: string; amountPaise: number; currency: string; keyId: string } }>("/booking/checkout", { method: "POST", body: JSON.stringify(input) }),
  verify: (bookingId: string, input: { orderId: string; paymentId: string; signature: string }) =>
    request<{ booking: Booking }>(`/booking/${bookingId}/payment/verify`, { method: "POST", body: JSON.stringify(input) }),
  myBookings: () => request<{ bookings: Booking[] }>("/booking/my-bookings"),
  ticket: (pnr: string) => request<{ booking: Booking }>(`/booking/tickets/${pnr}`),
  cancel: (pnr: string) => request<{ booking: Booking }>(`/booking/tickets/${pnr}/cancel`, { method: "POST" }),
};

export function getAccessToken() {
  return typeof window === "undefined" ? null : localStorage.getItem("accessToken");
}

export function getAdminAccessToken() {
  return typeof window === "undefined" ? null : localStorage.getItem("adminAccessToken");
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function setAdminTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem("adminAccessToken", accessToken);
  localStorage.setItem("adminRefreshToken", refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export function clearAdminTokens() {
  localStorage.removeItem("adminAccessToken");
  localStorage.removeItem("adminRefreshToken");
}
