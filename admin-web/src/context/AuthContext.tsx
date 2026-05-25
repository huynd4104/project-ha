import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "../api/authApi";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "ADMIN" | "PARENT";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface CustomUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  emailVerified: boolean;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserProfile = async () => {
    try {
      const res = await authApi.me();
      const profile = res.data.data;
      if (profile && profile.role === "ADMIN" && profile.isActive !== false) {
        setUserProfile(profile);
        setUser({
          uid: profile.id,
          email: profile.email,
          emailVerified: profile.emailVerified
        });
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (err) {
      console.error("Error refreshing admin profile:", err);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUserProfile();
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = userProfile?.role === "ADMIN";
  const emailVerified = user?.emailVerified || userProfile?.emailVerified || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAuthenticated,
        isAdmin,
        emailVerified,
        refreshUserProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
