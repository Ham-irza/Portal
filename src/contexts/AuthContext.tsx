import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenService } from '@/lib/api';

export type UserRole = 'partner' | 'admin' | 'team_member';

export interface Profile {
  id: number;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: UserRole;
  phone: string | null;
  country: string | null;
  department: string | null;
  specialization: string | null;
  max_workload: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  is_staff: boolean;
  is_superuser: boolean;
  partner?: {
    id: number;
    company_name: string;
    contact_name: string;
    status: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, companyName: string, contactPhone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const meData = await api.getMe();
      setUser(meData);
      
      // Map backend user data to profile format
      const profileData: Profile = {
        id: meData.id,
        email: meData.email,
        full_name: meData.partner?.contact_name || null,
        company_name: meData.partner?.company_name || null,
        role: meData.is_superuser ? 'admin' : meData.is_staff ? 'team_member' : 'partner',
        phone: null,
        country: null,
        department: null,
        specialization: null,
        max_workload: null,
        is_active: meData.partner?.status === 'active',
        created_at: '',
        updated_at: '',
      };
      setProfile(profileData);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const token = tokenService.getAccessToken();
      if (token) {
        try {
          await fetchProfile();
        } catch (error) {
          // Token might be invalid, clear it
          tokenService.clearTokens();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await api.login(email, password);
      await fetchProfile();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, companyName: string, contactPhone?: string) => {
    try {
      await api.register({
        email,
        password,
        company_name: companyName,
        contact_name: fullName,
        ...(contactPhone && { contact_phone: contactPhone }),
      });
      // After registration, automatically log in
      await signIn(email, password);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    tokenService.clearTokens();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
