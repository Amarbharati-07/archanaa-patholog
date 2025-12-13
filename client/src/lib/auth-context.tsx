import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signOut,
  type User as FirebaseUser
} from "firebase/auth";
import { auth } from "./firebase";
import type { Patient, Admin } from "@shared/schema";

interface AuthContextType {
  user: FirebaseUser | null;
  patient: Patient | null;
  admin: Admin | null;
  isLoading: boolean;
  loginPatient: (patient: Patient, token: string) => void;
  loginAdmin: (admin: Admin, token: string) => void;
  logout: () => Promise<void>;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First, restore session from localStorage (for email/password auth)
    const storedPatient = localStorage.getItem("patient");
    const storedToken = localStorage.getItem("token");
    if (storedPatient && storedToken) {
      try {
        setPatient(JSON.parse(storedPatient));
      } catch (e) {
        localStorage.removeItem("patient");
        localStorage.removeItem("token");
      }
    }
    
    const storedAdmin = localStorage.getItem("admin");
    const storedAdminToken = localStorage.getItem("adminToken");
    if (storedAdmin && storedAdminToken) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        localStorage.removeItem("admin");
        localStorage.removeItem("adminToken");
      }
    }

    // Then listen to Firebase auth state changes (for Firebase auth)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    // Set loading to false immediately if no Firebase auth needed
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const loginPatient = (patientData: Patient, token: string) => {
    setPatient(patientData);
    localStorage.setItem("patient", JSON.stringify(patientData));
    localStorage.setItem("token", token);
  };

  const loginAdmin = (adminData: Admin, token: string) => {
    setAdmin(adminData);
    localStorage.setItem("admin", JSON.stringify(adminData));
    localStorage.setItem("adminToken", token);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase sign out error:", error);
    }
    setPatient(null);
    setAdmin(null);
    setUser(null);
    localStorage.removeItem("patient");
    localStorage.removeItem("admin");
    localStorage.removeItem("token");
    localStorage.removeItem("adminToken");
  };

  const getToken = () => {
    return localStorage.getItem("token") || localStorage.getItem("adminToken");
  };

  return (
    <AuthContext.Provider value={{ user, patient, admin, isLoading, loginPatient, loginAdmin, logout, getToken }}>
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
