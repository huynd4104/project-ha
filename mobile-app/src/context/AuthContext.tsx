import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, reload, signOut, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { Alert } from "react-native";

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: "PARENT" | "ADMIN";
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
  isParent: boolean;
  emailVerified: boolean;
  hasChild: boolean;
  checkChildren: () => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [hasChild, setHasChild] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  const fetchOrCreateProfile = async (firebaseUser: User): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(docRef);
      
      if (!snap.exists()) {
        const now = serverTimestamp();
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          fullName: firebaseUser.displayName || "Phụ Huynh",
          role: "PARENT",
          isActive: true,
          emailVerified: firebaseUser.emailVerified,
          createdAt: now,
          updatedAt: now
        };
        await setDoc(docRef, newProfile);
        return newProfile;
      }
      
      const data = snap.data() as UserProfile;
      
      // Sync fields if they changed in Firebase Auth
      if (data.emailVerified !== firebaseUser.emailVerified || data.email !== firebaseUser.email) {
        data.emailVerified = firebaseUser.emailVerified;
        if (firebaseUser.email) data.email = firebaseUser.email;
        await setDoc(docRef, { 
          emailVerified: firebaseUser.emailVerified, 
          email: firebaseUser.email || data.email,
          updatedAt: serverTimestamp() 
        }, { merge: true });
      }
      
      return data;
    } catch (err) {
      console.error("Error fetching or creating user profile:", err);
      return null;
    }
  };

  const checkChildren = async () => {
    if (!auth.currentUser) {
      setHasChild(false);
      return;
    }
    try {
      const snap = await getDocs(query(collection(db, "children"), where("userId", "==", auth.currentUser.uid)));
      setHasChild(snap.docs.length > 0);
    } catch (err) {
      console.error("Error checking children profiles:", err);
      setHasChild(false);
    }
  };

  const refreshUserProfile = async () => {
    if (!auth.currentUser) return;
    try {
      await reload(auth.currentUser);
      const profile = await fetchOrCreateProfile(auth.currentUser);
      await checkChildren();
      setUser(auth.currentUser);
      setUserProfile(profile);
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Signout error:", err);
    } finally {
      setUser(null);
      setUserProfile(null);
      setHasChild(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Ensure email verification status is updated from fresh check
        try {
          await reload(firebaseUser);
        } catch (e) {
          console.log("Could not reload user at auth change:", e);
        }
        
        const profile = await fetchOrCreateProfile(firebaseUser);
        
        if (profile && profile.isActive === false) {
          Alert.alert("Tài khoản bị khóa", "Tài khoản của bạn đã bị khóa bởi quản trị viên.");
          await signOut(auth);
          setUser(null);
          setUserProfile(null);
          setHasChild(false);
        } else {
          await checkChildren();
          setUser(firebaseUser);
          setUserProfile(profile);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setHasChild(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = userProfile?.role === "ADMIN";
  const isParent = userProfile?.role === "PARENT";
  const emailVerified = user?.emailVerified || false;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isAuthenticated,
        isAdmin,
        isParent,
        emailVerified,
        hasChild,
        checkChildren,
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
