const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

export type AnyRecord = Record<string, unknown>;

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export const tokenStore = {
  get accessToken() {
    return localStorage.getItem("admin_access_token") ?? "";
  },
  get refreshToken() {
    return localStorage.getItem("admin_refresh_token") ?? "";
  },
  set(accessToken: string, refreshToken: string) {
    localStorage.setItem("admin_access_token", accessToken);
    localStorage.setItem("admin_refresh_token", refreshToken);
  },
  clear() {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
  },
};

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(tokenStore.accessToken ? { Authorization: `Bearer ${tokenStore.accessToken}` } : {}),
      ...init.headers,
    },
  });
  if (response.status === 401 && retry && tokenStore.refreshToken) {
    const refreshed = await refresh();
    if (refreshed) return request<T>(path, init, false);
  }
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new ApiError(data?.message ?? data?.error ?? "Backend error", response.status);
  }
  return data as T;
}

async function refresh() {
  try {
    const data = await request<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: tokenStore.refreshToken }),
    }, false);
    tokenStore.set(data.accessToken, data.refreshToken);
    return true;
  } catch {
    tokenStore.clear();
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: AnyRecord) => request<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) }),
  put: <T>(path: string, body?: AnyRecord) => request<T>(path, { method: "PUT", body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
