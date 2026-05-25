import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore, AnyRecord } from "../api/client";

type AuthContextValue = {
  user: AnyRecord | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AnyRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.accessToken) {
      setLoading(false);
      return;
    }
    api.get<AnyRecord>("/api/me")
      .then((profile) => setUser(profile))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    async login(email, password) {
      const data = await api.post<{ accessToken: string; refreshToken: string; user: AnyRecord }>("/api/auth/login", { email, password });
      tokenStore.set(data.accessToken, data.refreshToken);
      setUser(data.user);
    },
    async logout() {
      try {
        await api.post("/api/auth/logout", { refreshToken: tokenStore.refreshToken });
      } finally {
        tokenStore.clear();
        setUser(null);
      }
    },
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
