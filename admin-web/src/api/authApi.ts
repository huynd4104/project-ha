import { httpClient } from "./httpClient";

export const authApi = {
  async login(email: string, password: string) {
    const res = await httpClient.post("/api/auth/login", { email, password });
    const { accessToken, refreshToken, user } = res.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    return { data: { data: { token: accessToken, user } } };
  },
  async me() {
    const token = localStorage.getItem("accessToken");
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
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) {
        await httpClient.post("/api/auth/logout", { refreshToken });
      }
    } catch (e) {
      console.error("Logout failed on backend:", e);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
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
