"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

type AuthProfileResponse = {
  uid: string;
  email: string | null;
  role: "admin" | "coordinator" | "staff" | null;
  accessRole?: string | null;
};

type AuthContextType = {
  user: FirebaseUser | null;
  role: AuthProfileResponse["role"] | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<AuthProfileResponse["role"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseClientAuth();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          
          if (response.ok) {
            const data: AuthProfileResponse = await response.json();
            setRole(data.role);
          } else {
            setRole(null);
          }
        } catch (error) {
          console.error("Failed to fetch user role", error);
          setRole(null);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}
