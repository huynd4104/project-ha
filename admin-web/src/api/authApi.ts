import { httpClient } from "./httpClient";

export const authApi = {
  async login(email: string, password: string) {
    const res = await httpClient.post("/api/auth/login", { email, password });
    const { accessToken, refreshToken, user } = res.data;
    localStorage.setItem("admin_access_token", accessToken);
    localStorage.setItem("admin_refresh_token", refreshToken);
    return { data: { data: { token: accessToken, user } } };
  },
  async me() {
    const token = localStorage.getItem("admin_access_token");
    if (!token) return { data: { data: null } };
    try {
      const res = await httpClient.get("/api/me");
      return { data: { data: res.data } };
    } catch (e) {
      this.logout();
      return { data: { data: null } };
    }
  },
  async logout() {
    const refreshToken = localStorage.getItem("admin_refresh_token");
    try {
      if (refreshToken) {
        await httpClient.post("/api/auth/logout", { refreshToken });
      }
    } catch (e) {
      console.error("Logout failed on backend:", e);
    } finally {
      localStorage.removeItem("admin_access_token");
      localStorage.removeItem("admin_refresh_token");
    }
  },
  async changePassword(currentPassword: string, newPassword: string) {
    const res = await httpClient.post("/api/auth/change-password", { currentPassword, newPassword });
    return res.data;
  },
  async forgotPassword(email: string) {
    const res = await httpClient.post("/api/auth/forgot-password", { email });
    return res.data;
  }
};
