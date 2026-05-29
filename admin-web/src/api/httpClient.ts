const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem("admin_refresh_token");
  if (!refreshToken) {
    return false;
  }
  try {
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) {
      throw new Error("Refresh failed");
    }
    const data = await response.json();
    localStorage.setItem("admin_access_token", data.accessToken);
    localStorage.setItem("admin_refresh_token", data.refreshToken);
    return true;
  } catch (error) {
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("admin_refresh_token");
    return false;
  }
}

export const httpClient = {
  async get(url: string) {
    return this.request(url, "GET");
  },
  async post(url: string, body?: any) {
    return this.request(url, "POST", body);
  },
  async put(url: string, body?: any) {
    return this.request(url, "PUT", body);
  },
  async patch(url: string, body?: any) {
    return this.request(url, "PATCH", body);
  },
  async delete(url: string) {
    return this.request(url, "DELETE");
  },
  async request(url: string, method: string, body?: any, retry = true): Promise<any> {
    const token = localStorage.getItem("admin_access_token");
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(`${BASE_URL}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (response.status === 401 && retry) {
      const refreshToken = localStorage.getItem("admin_refresh_token");
      if (refreshToken) {
        if (!refreshPromise) {
          refreshPromise = refreshTokens().then((success) => {
            refreshPromise = null;
            return success;
          });
        }
        const refreshed = await refreshPromise;
        if (refreshed) {
          return this.request(url, method, body, false);
        }
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      let message = "Đã xảy ra lỗi hệ thống.";
      try {
        const parsed = JSON.parse(errText);
        message = parsed.message || message;
      } catch (e) {
        if (errText) message = errText;
      }
      throw new Error(message);
    }

    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    return { data };
  }
};

