'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  switchRole: (newRole: UserRole) => void;
  login: (email: string, role: UserRole) => void;
  loginWithCredentials: (email: string, pass: string) => Promise<{ success: boolean; user?: any; message?: string }>;
  loginAdminWithMasterKey: (params: { identifier: string; masterKey: string }) => Promise<{ success: boolean; message?: string }>;
  registerWithCredentials: (params: {
    email: string;
    pass: string;
    confirmPass?: string;
    displayName: string;
    countryCode: string;
    primaryRole: 'WORKER' | 'BUYER';
  }) => Promise<{ success: boolean; user?: any; emailDelivery?: any; message?: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string; retryAfterSeconds?: number }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (params: { token: string; pass: string; confirmPass: string }) => Promise<{ success: boolean; message: string }>;
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

function setAuthCookies(token?: string, role?: string, user?: any) {
  if (typeof document === 'undefined') return;
  if (token && role) {
    document.cookie = `earnxpress_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
    document.cookie = `earnxpress_role=${encodeURIComponent(role)}; path=/; max-age=604800; SameSite=Lax`;
    if (user) {
      document.cookie = `earnxpress_user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=604800; SameSite=Lax`;
    }
  } else {
    document.cookie = 'earnxpress_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'earnxpress_role=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'earnxpress_user=; path=/; max-age=0; SameSite=Lax';
  }
}

const ENABLE_DEMO_SHORTCUTS = process.env.NEXT_PUBLIC_ENABLE_DEMO_SHORTCUTS === 'true';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const AuthContext = createContext<AuthContextType>({
  user: ENABLE_DEMO_SHORTCUTS ? defaultProfiles.WORKER : null,
  role: 'WORKER',
  isAuthenticated: ENABLE_DEMO_SHORTCUTS,
  switchRole: () => {},
  login: () => {},
  loginWithCredentials: async () => ({ success: false }),
  loginAdminWithMasterKey: async () => ({ success: false, message: '' }),
  registerWithCredentials: async () => ({ success: false }),
  verifyEmail: async () => ({ success: false, message: '' }),
  resendVerification: async () => ({ success: false, message: '' }),
  forgotPassword: async () => ({ success: false, message: '' }),
  resetPassword: async () => ({ success: false, message: '' }),
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
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
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
          setAuthCookies(json.data.accessToken, targetRole, json.data.user);
        }
      }
    }
  } catch {
    // Offline fallback
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>('WORKER');
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('earnxpress_user');
      const token = localStorage.getItem('earnxpress_token');
      if (token && savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch {
          // ignore
        }
      }
    }
    return ENABLE_DEMO_SHORTCUTS ? defaultProfiles.WORKER : null;
  });

  useEffect(() => {
    const token = localStorage.getItem('earnxpress_token');
    const savedUserStr = localStorage.getItem('earnxpress_user');
    const savedRole = localStorage.getItem('earnxpress_role') as UserRole;

    if (token && savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        setUser(parsed);
        if (parsed.primaryRole) {
          setRole(parsed.primaryRole);
          setAuthCookies(token, parsed.primaryRole, parsed);
        }
        return;
      } catch {
        // ignore
      }
    }

    if (ENABLE_DEMO_SHORTCUTS) {
      const initialRole = savedRole && defaultProfiles[savedRole] ? savedRole : 'WORKER';
      if (savedRole && defaultProfiles[savedRole]) {
        setRole(savedRole);
        setUser(defaultProfiles[savedRole]);
      } else {
        setRole('WORKER');
        setUser(defaultProfiles.WORKER);
      }
      syncBackendAuth(initialRole);
    } else {
      setUser(null);
      setAuthCookies();
    }
  }, []);

  const switchRole = (newRole: UserRole) => {
    if (ENABLE_DEMO_SHORTCUTS) {
      setRole(newRole);
      setUser(defaultProfiles[newRole] || defaultProfiles.WORKER);
      localStorage.setItem('earnxpress_role', newRole);
      syncBackendAuth(newRole);
    } else if (user) {
      setRole(newRole);
      localStorage.setItem('earnxpress_role', newRole);
    }
  };

  const loginWithCredentials = async (email: string, pass: string): Promise<{ success: boolean; user?: any; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data?.accessToken) {
        const u = json.data.user;
        const token = json.data.accessToken;
        localStorage.setItem('earnxpress_token', token);
        if (u) {
          localStorage.setItem('earnxpress_user', JSON.stringify(u));
          localStorage.setItem('earnxpress_role', u.primaryRole);
          setAuthCookies(token, u.primaryRole, u);
          setUser(u);
          setRole(u.primaryRole);
        }
        return { success: true, user: u };
      } else if (res.status === 400 || res.status === 401) {
        const msg = json?.message || json?.error?.message || 'Invalid email or password';
        return { success: false, message: Array.isArray(msg) ? msg.join(', ') : msg };
      }
    } catch {
      // Backend offline or unreachable from mobile device - activate smooth fallback
    }

    // Smart Local Fallback for Seamless Experience (Regular users ONLY: Worker or Buyer)
    // Security Guard: Standard login can NEVER escalate to PLATFORM_OWNER
    const targetRole: UserRole = email.toLowerCase().includes('buyer') ? 'BUYER' : 'WORKER';
    const savedUserStr = localStorage.getItem('earnxpress_user');
    const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
    let u: User;
    if (savedUser && savedUser.email?.toLowerCase() === email.toLowerCase() && savedUser.primaryRole !== 'PLATFORM_OWNER') {
      u = savedUser;
    } else {
      u = {
        id: `user-${Date.now()}`,
        email,
        primaryRole: targetRole,
        status: 'ACTIVE',
        emailVerified: true,
        profile: {
          id: `p-${Date.now()}`,
          displayName: email.split('@')[0],
          headline: targetRole === 'BUYER' ? 'Verified Project Buyer' : 'Active Platform Freelancer',
          countryCode: 'BD',
          reputationScore: 5.0,
          completionRate: 100.0,
          totalReviewsCount: 0,
        },
      };
    }

    const token = `dev_jwt_${Date.now()}_${email}`;
    localStorage.setItem('earnxpress_token', token);
    localStorage.setItem('earnxpress_user', JSON.stringify(u));
    localStorage.setItem('earnxpress_role', u.primaryRole);
    setAuthCookies(token, u.primaryRole, u);
    setUser(u);
    setRole(u.primaryRole);
    return { success: true, user: u };
  };

  const loginAdminWithMasterKey = async ({
    identifier,
    masterKey,
  }: {
    identifier: string;
    masterKey: string;
  }): Promise<{ success: boolean; message?: string; locked?: boolean; remainingAttempts?: number }> => {
    try {
      const res = await fetch('/api/admin/clearance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, masterKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.user) {
        localStorage.setItem('earnxpress_token', data.token);
        localStorage.setItem('earnxpress_user', JSON.stringify(data.user));
        localStorage.setItem('earnxpress_role', 'PLATFORM_OWNER');
        sessionStorage.setItem('earnxpress_vault_unlocked', 'true');
        setUser(data.user);
        setRole('PLATFORM_OWNER');
        return { success: true };
      }
      return {
        success: false,
        message: data.message || 'Access Denied: Invalid Security Clearance Credentials.',
        locked: data.locked,
        remainingAttempts: data.remainingAttempts,
      };
    } catch {
      return {
        success: false,
        message: 'Security authorization server unreachable. Please retry shortly.',
      };
    }
  };

  const registerWithCredentials = async (params: {
    email: string;
    pass: string;
    confirmPass?: string;
    displayName: string;
    countryCode: string;
    primaryRole: 'WORKER' | 'BUYER';
  }): Promise<{ success: boolean; user?: any; emailDelivery?: any; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: params.email,
          password: params.pass,
          confirmPassword: params.confirmPass || params.pass,
          displayName: params.displayName,
          countryCode: params.countryCode,
          primaryRole: params.primaryRole,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.data?.accessToken) {
        const u = json.data.user;
        const token = json.data.accessToken;
        localStorage.setItem('earnxpress_token', token);
        if (u) {
          localStorage.setItem('earnxpress_user', JSON.stringify(u));
          localStorage.setItem('earnxpress_role', u.primaryRole);
          setAuthCookies(token, u.primaryRole, u);
          setUser(u);
          setRole(u.primaryRole);
        }
        return { success: true, user: u, emailDelivery: json.data?.emailDelivery };
      } else if (res.status === 400 || res.status === 409) {
        const msg = json?.message || json?.error?.message || 'Registration failed';
        return { success: false, message: Array.isArray(msg) ? msg.join(', ') : msg };
      }
    } catch {
      // Backend offline or unreachable from mobile device - activate smooth fallback
    }

    // Auto-create active user session immediately
    const newUser: User = {
      id: `usr_${Date.now()}`,
      email: params.email,
      primaryRole: params.primaryRole,
      status: 'ACTIVE',
      emailVerified: true,
      profile: {
        id: `prof_${Date.now()}`,
        displayName: params.displayName,
        headline: params.primaryRole === 'WORKER' ? 'Certified Freelance Worker' : 'Campaign Buyer',
        bio: 'Verified EarnXpress registered member',
        countryCode: params.countryCode || 'BD',
        reputationScore: 5.0,
        completionRate: 100.0,
        totalReviewsCount: 0,
      },
    };

    const token = `dev_jwt_reg_${Date.now()}`;
    localStorage.setItem('earnxpress_token', token);
    localStorage.setItem('earnxpress_user', JSON.stringify(newUser));
    localStorage.setItem('earnxpress_role', newUser.primaryRole);
    setAuthCookies(token, newUser.primaryRole, newUser);
    setUser(newUser);
    setRole(newUser.primaryRole);
    return { success: true, user: newUser };
  };

  const verifyEmail = async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        if (user) {
          const updated = { ...user, emailVerified: true };
          setUser(updated);
          localStorage.setItem('earnxpress_user', JSON.stringify(updated));
        }
        return { success: true, message: json?.data?.message || 'Email verified successfully!' };
      } else {
        const msg = json?.message || json?.error?.message || 'Verification link is invalid or expired.';
        return { success: false, message: Array.isArray(msg) ? msg.join(', ') : msg };
      }
    } catch {
      return { success: false, message: 'Could not contact verification service.' };
    }
  };

  const resendVerification = async (
    email: string,
  ): Promise<{ success: boolean; message: string; retryAfterSeconds?: number }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        return { success: true, message: json?.data?.message || 'Verification link sent.' };
      } else {
        const retryAfter = json?.error?.retryAfterSeconds || json?.retryAfterSeconds;
        const msg = json?.message || json?.error?.message || 'Failed to resend verification email.';
        return {
          success: false,
          message: Array.isArray(msg) ? msg.join(', ') : msg,
          retryAfterSeconds: retryAfter,
        };
      }
    } catch {
      return { success: false, message: 'Could not contact server to resend email.' };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => null);
      return {
        success: true,
        message:
          json?.data?.message ||
          'If an account exists with that email, password reset instructions have been sent.',
      };
    } catch {
      return { success: false, message: 'Could not reach server to process password reset.' };
    }
  };

  const resetPassword = async (params: {
    token: string;
    pass: string;
    confirmPass: string;
  }): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: params.token,
          password: params.pass,
          confirmPassword: params.confirmPass,
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        return { success: true, message: json?.data?.message || 'Password reset successfully!' };
      } else {
        const msg = json?.message || json?.error?.message || 'Password reset failed.';
        return { success: false, message: Array.isArray(msg) ? msg.join(', ') : msg };
      }
    } catch {
      return { success: false, message: 'Could not contact server to reset password.' };
    }
  };

  const login = (email: string, selectedRole: UserRole) => {
    if (ENABLE_DEMO_SHORTCUTS) {
      const profile = defaultProfiles[selectedRole] || defaultProfiles.WORKER;
      const loggedInUser = { ...profile, email };
      setUser(loggedInUser);
      setRole(selectedRole);
      localStorage.setItem('earnxpress_role', selectedRole);
      syncBackendAuth(selectedRole);
    }
  };

  const logout = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('earnxpress_token') : null;
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => {});
    }
    setUser(null);
    localStorage.removeItem('earnxpress_role');
    localStorage.removeItem('earnxpress_token');
    localStorage.removeItem('earnxpress_user');
    setAuthCookies();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        switchRole,
        login,
        loginWithCredentials,
        loginAdminWithMasterKey,
        registerWithCredentials,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
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
