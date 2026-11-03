'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  switchRole: (newRole: UserRole) => void;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
}

const defaultProfiles: Record<UserRole, User> = {
  WORKER: {
    id: 'worker-user-1',
    email: 'worker@earnxpress.demo',
    primaryRole: 'WORKER',
    status: 'ACTIVE',
    emailVerified: true,
    profile: {
      id: 'p-worker-1',
      displayName: 'Rahim Chowdhury',
      headline: 'Senior Fullstack Engineer & AI Annotation Specialist',
      bio: 'Top-rated international worker with 100% verified deliverable completion record.',
      countryCode: 'BD',
      reputationScore: 4.98,
      completionRate: 99.4,
      totalReviewsCount: 54,
    },
  },
  BUYER: {
    id: 'buyer-user-1',
    email: 'buyer@earnxpress.demo',
    primaryRole: 'BUYER',
    status: 'ACTIVE',
    emailVerified: true,
    profile: {
      id: 'p-buyer-1',
      displayName: 'Global Retail AI Lab',
      headline: 'Enterprise Machine Learning Data Team',
      countryCode: 'US',
      reputationScore: 4.95,
      completionRate: 99.2,
      totalReviewsCount: 142,
    },
  },
  PLATFORM_OWNER: {
    id: 'owner-user-1',
    email: 'owner@earnxpress.demo',
    primaryRole: 'PLATFORM_OWNER',
    status: 'ACTIVE',
    emailVerified: true,
    profile: {
      id: 'p-owner-1',
      displayName: 'Platform Owner',
      headline: 'EarnXpress Root Administrative Authority',
      countryCode: 'US',
      reputationScore: 5.0,
      completionRate: 100.0,
      totalReviewsCount: 0,
    },
  },
  SUPER_ADMIN: {
    id: 'admin-user-1',
    email: 'admin@earnxpress.demo',
    primaryRole: 'SUPER_ADMIN',
    status: 'ACTIVE',
    emailVerified: true,
    profile: {
      id: 'p-admin-1',
      displayName: 'Staff Super Admin',
      headline: 'Operations & Moderation Lead',
      countryCode: 'US',
      reputationScore: 5.0,
      completionRate: 100.0,
      totalReviewsCount: 0,
    },
  },
  MODERATOR: {
    id: 'mod-user-1',
    email: 'moderator@earnxpress.demo',
    primaryRole: 'MODERATOR',
    status: 'ACTIVE',
    emailVerified: true,
    profile: {
      id: 'p-mod-1',
      displayName: 'Dispute Moderator',
      countryCode: 'CA',
      reputationScore: 5.0,
      completionRate: 100.0,
      totalReviewsCount: 0,
    },
  },
  SUPPORT_AGENT: {
    id: 'support-user-1',
    email: 'support@earnxpress.demo',
    primaryRole: 'SUPPORT_AGENT',
    status: 'ACTIVE',
    emailVerified: true,
    profile: {
      id: 'p-support-1',
      displayName: 'Support Agent',
      countryCode: 'GB',
      reputationScore: 5.0,
      completionRate: 100.0,
      totalReviewsCount: 0,
    },
  },
};

const AuthContext = createContext<AuthContextType>({
  user: defaultProfiles.WORKER,
  role: 'WORKER',
  isAuthenticated: true,
  switchRole: () => {},
  login: () => {},
  logout: () => {},
});

const demoCredentials: Record<UserRole, { email: string; pass: string }> = {
  WORKER: { email: 'worker1@earnxpress.demo', pass: 'Password123!' },
  BUYER: { email: 'buyer@earnxpress.demo', pass: 'Password123!' },
  PLATFORM_OWNER: { email: 'owner@earnxpress.demo', pass: 'Password123!' },
  SUPER_ADMIN: { email: 'admin@earnxpress.demo', pass: 'Password123!' },
  MODERATOR: { email: 'admin@earnxpress.demo', pass: 'Password123!' },
  SUPPORT_AGENT: { email: 'admin@earnxpress.demo', pass: 'Password123!' },
};

async function syncBackendAuth(targetRole: UserRole) {
  const creds = demoCredentials[targetRole];
  if (!creds || typeof window === 'undefined') return;
  try {
    const res = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: creds.email, password: creds.pass }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data?.accessToken) {
        localStorage.setItem('earnxpress_token', json.data.accessToken);
        if (json.data.user) {
          localStorage.setItem('earnxpress_user', JSON.stringify(json.data.user));
        }
      }
    }
  } catch {
    // Offline fallback
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('WORKER');
  const [user, setUser] = useState<User | null>(defaultProfiles.WORKER);

  useEffect(() => {
    const savedRole = localStorage.getItem('earnxpress_role') as UserRole;
    const initialRole = savedRole && defaultProfiles[savedRole] ? savedRole : 'WORKER';
    if (savedRole && defaultProfiles[savedRole]) {
      setRole(savedRole);
      setUser(defaultProfiles[savedRole]);
    }
    syncBackendAuth(initialRole);
  }, []);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    setUser(defaultProfiles[newRole] || defaultProfiles.WORKER);
    localStorage.setItem('earnxpress_role', newRole);
    syncBackendAuth(newRole);
  };

  const login = (email: string, selectedRole: UserRole) => {
    const profile = defaultProfiles[selectedRole] || defaultProfiles.WORKER;
    const loggedInUser = { ...profile, email };
    setUser(loggedInUser);
    setRole(selectedRole);
    localStorage.setItem('earnxpress_role', selectedRole);
    syncBackendAuth(selectedRole);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('earnxpress_role');
    localStorage.removeItem('earnxpress_token');
    localStorage.removeItem('earnxpress_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        switchRole,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
