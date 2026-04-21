import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase, getUserProfile, getVendorProfile } from '../config/supabase';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const syncProfileWithBackend = async ({ accessToken, role, full_name = '', phone = '' }) => {
  if (!API_URL || !accessToken) {
    return null;
  }

  const response = await fetch(`${API_URL}/users/sync-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ role, full_name, phone }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Failed to sync user profile');
  }

  return result.user;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const mountedRef = useRef(true);

  const loadUserState = async (nextSession) => {
    if (!mountedRef.current) {
      return;
    }

    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setProfile(null);
      setVendorProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      let userProfile = await getUserProfile(nextSession.user.id);

      if (!userProfile) {
        const intendedRole = localStorage.getItem('oauth_intended_role') || 'customer';
        localStorage.removeItem('oauth_intended_role');

        userProfile = await syncProfileWithBackend({
          accessToken: nextSession.access_token,
          role: intendedRole,
          full_name: nextSession.user.user_metadata?.full_name || nextSession.user.user_metadata?.name || '',
          phone: nextSession.user.user_metadata?.phone || '',
        });
      }

      if (!mountedRef.current) {
        return;
      }

      setProfile(userProfile);

      if (userProfile?.role === 'vendor') {
        const vendor = await getVendorProfile(nextSession.user.id);
        if (mountedRef.current) {
          setVendorProfile(vendor);
        }
      } else {
        setVendorProfile(null);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      if (mountedRef.current) {
        setProfile(null);
        setVendorProfile(null);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession()
      .then(({ data: { session: initialSession } }) => loadUserState(initialSession))
      .catch((error) => {
        console.error('Error getting session:', error);
        if (mountedRef.current) {
          setLoading(false);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      loadUserState(nextSession);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, userData) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const activeSession = data.session || (await supabase.auth.getSession()).data.session;
      if (activeSession?.access_token) {
        await syncProfileWithBackend({
          accessToken: activeSession.access_token,
          role: userData.role,
          full_name: userData.full_name,
          phone: userData.phone,
        });
        await loadUserState(activeSession);
      } else {
        setLoading(false);
      }

      return { data, error: null };
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signInWithGoogle = async (intendedRole = 'customer') => {
    try {
      localStorage.setItem('oauth_intended_role', intendedRole);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/shop`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setProfile(null);
      setVendorProfile(null);
      setSession(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      const refreshedProfile = await getUserProfile(user.id);
      setProfile(refreshedProfile);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        throw error;
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const refreshVendorProfile = async () => {
    if (!user) {
      return null;
    }

    try {
      const vendor = await getVendorProfile(user.id);
      setVendorProfile(vendor);
      return vendor;
    } catch (error) {
      console.error('Error refreshing vendor profile:', error);
      return null;
    }
  };

  const refreshAuthState = async () => {
    try {
      const { data: { session: latestSession } } = await supabase.auth.getSession();
      await loadUserState(latestSession);
      return latestSession;
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        vendorProfile,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        updateProfile,
        resetPassword,
        refreshVendorProfile,
        refreshAuthState,
        isAuthenticated: !!user,
        isVendor: profile?.role === 'vendor',
        isAdmin: profile?.role === 'admin',
        isCustomer: profile?.role === 'customer',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
