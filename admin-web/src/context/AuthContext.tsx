import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, reload, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

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

interface AuthContextType {
  user: User | null;
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
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }
      return { id: snap.id, ...snap.data() } as UserProfile;
    } catch (err) {
      console.error("Error reading admin user document:", err);
      return null;
    }
  };

  const refreshUserProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await reload(auth.currentUser);
      const profile = await fetchProfile(auth.currentUser);
      setUser(auth.currentUser);
      setUserProfile(profile);
    } catch (err) {
      console.error("Error refreshing admin profile:", err);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          await reload(firebaseUser);
        } catch (e) {
          console.log("Could not reload admin user:", e);
        }
        
        const profile = await fetchProfile(firebaseUser);
        
        if (!profile || profile.role !== "ADMIN" || profile.isActive === false) {
          // Force sign out immediately if they are not an active admin
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
        } else {
          setUser(firebaseUser);
          setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
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
