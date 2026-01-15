import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase, getUserProfile, getVendorProfile } from '../config/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vendorProfile, setVendorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const isSigningUp = useRef(false);

  useEffect(() => {
    console.log('🚀 AuthContext initializing...');

    // Add a timeout to ensure loading doesn't stay true forever
    const loadingTimeout = setTimeout(() => {
      console.warn('⚠️ Loading timeout - forcing loading to FALSE after 3 seconds');
      setLoading(false);
    }, 3000);

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        clearTimeout(loadingTimeout);

        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('📱 Initial session check:', session ? 'User logged in' : 'No user');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('👤 Found existing session, loading profile...');
          loadUserProfile(session.user.id);
        } else {
          console.log('✅ No session - setting loading to FALSE');
          setLoading(false);
        }
      })
      .catch((error) => {
        clearTimeout(loadingTimeout);
        console.error('❌ Exception getting session:', error);
        setLoading(false);
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed:', _event, session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);

      // Only load profile if we're not in the middle of a signup operation
      if (session?.user) {
        console.log('👤 Auth change detected, checking if profile needs loading...');
        console.log('🔍 isSigningUp:', isSigningUp.current);

        // Skip loading if we're in the middle of signup (signUp function will set the profile)
        if (isSigningUp.current) {
          console.log('⏭️ Skipping profile load - signup in progress, profile will be set by signUp()');
          return;
        }

        console.log('📥 Loading profile from database...');
        // Use a small delay to ensure any pending operations complete
        setTimeout(async () => {
          await loadUserProfile(session.user.id);
        }, 100);
      } else {
        setProfile(null);
        setVendorProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId) => {
    try {
      console.log('🔄 Loading user profile for ID:', userId);
      const userProfile = await getUserProfile(userId);

      if (!userProfile) {
        console.error('❌ User profile NOT FOUND for userId:', userId);
        console.log('⚠️ This means the user exists in Supabase Auth but NOT in the users table!');

        // Check if this is an OAuth user (Google sign-in)
        const { data: authUser } = await supabase.auth.getUser();
        if (authUser?.user) {
          const isOAuthUser = authUser.user.app_metadata?.provider === 'google';

          if (isOAuthUser) {
            console.log('🔍 Detected OAuth user, creating profile...');

            // Get intended role from localStorage
            const intendedRole = localStorage.getItem('oauth_intended_role') || 'customer';
            localStorage.removeItem('oauth_intended_role'); // Clean up

            // Create profile for OAuth user
            const { data: newProfile, error: profileError } = await supabase
              .from('users')
              .insert([{
                id: userId,
                email: authUser.user.email,
                full_name: authUser.user.user_metadata?.full_name || authUser.user.user_metadata?.name || '',
                phone: authUser.user.user_metadata?.phone || '',
                role: intendedRole,
              }])
              .select()
              .single();

            if (profileError) {
              console.error('❌ Failed to create OAuth user profile:', profileError);
            } else {
              console.log('✅ OAuth user profile created:', newProfile);
              setProfile(newProfile);

              // If vendor role, load vendor profile
              if (intendedRole === 'vendor') {
                const vendor = await getVendorProfile(userId);
                setVendorProfile(vendor);
              }

              setLoading(false);
              return;
            }
          }
        }

        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('✅ User profile loaded successfully:', userProfile);
      setProfile(userProfile);

      // If user is a vendor, load vendor profile
      if (userProfile?.role === 'vendor') {
        console.log('🏪 Loading vendor profile...');
        const vendor = await getVendorProfile(userId);
        console.log('Vendor profile:', vendor);
        setVendorProfile(vendor);
      }
    } catch (error) {
      console.error('❌ Error loading profile:', error);
      setProfile(null);
    } finally {
      console.log('✅ Profile loading complete. Loading state set to false.');
      setLoading(false);
    }
  };

  const signUp = async (email, password, userData) => {
    console.log('📝 Starting signup process for:', email);
    console.log('📋 User data to create:', userData);

    // Set flag to prevent onAuthStateChange from loading profile
    isSigningUp.current = true;

    try {
      // Sign up user
      console.log('🔐 Calling supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('📦 Signup response received:', {
        hasData: !!data,
        hasUser: !!data?.user,
        userId: data?.user?.id,
        hasSession: !!data?.session,
        hasError: !!error
      });

      if (error) {
        console.error('❌ Auth signup error:', error);
        throw error;
      }

      if (!data.user) {
        console.error('❌ No user in signup response!');
        throw new Error('Signup succeeded but no user returned');
      }

      console.log('✅ Auth user created with ID:', data.user.id);

      // Check if profile already exists
      console.log('🔍 Checking if profile already exists...');
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      console.log('📦 Existing profile check:', {
        hasExisting: !!existingProfile,
        checkError: checkError?.message
      });

      let profileData;

      if (existingProfile) {
        console.log('⚠️ Profile already exists!');
        console.log('Existing role:', existingProfile.role);
        console.log('New role from signup:', userData.role);

        // Update the profile if role or other data is different
        if (existingProfile.role !== userData.role ||
            !existingProfile.full_name ||
            !existingProfile.phone) {
          console.log('🔄 Updating existing profile with new data...');

          const { data: updatedProfile, error: updateError } = await supabase
            .from('users')
            .update({
              full_name: userData.full_name,
              phone: userData.phone,
              role: userData.role || 'customer',
            })
            .eq('id', data.user.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Profile update error:', updateError);
            // Use existing profile if update fails
            profileData = existingProfile;
          } else {
            console.log('✅ Profile updated successfully!');
            profileData = updatedProfile;
          }
        } else {
          console.log('✅ Profile already correct, using existing profile');
          profileData = existingProfile;
        }
      } else {
        // Create profile in users table
        console.log('📋 Now creating user profile in users table...');
        const profileToInsert = {
          id: data.user.id,
          email: email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role || 'customer',
        };
        console.log('📋 Profile to insert:', profileToInsert);

        console.log('💾 Executing INSERT query...');
        const { data: newProfile, error: profileError } = await supabase
          .from('users')
          .insert([profileToInsert])
          .select()
          .single();

        console.log('📦 Profile insert response:', {
          hasProfileData: !!newProfile,
          profileData: newProfile,
          hasError: !!profileError,
          errorMessage: profileError?.message,
          errorCode: profileError?.code
        });

        if (profileError) {
          console.error('❌ Profile creation error:', profileError);
          console.error('❌ Error code:', profileError.code);
          console.error('❌ Error message:', profileError.message);
          console.error('❌ Error details:', profileError.details);
          console.error('❌ Error hint:', profileError.hint);
          throw new Error(profileError.message || 'Failed to create user profile.');
        }

        if (!newProfile) {
          console.error('❌ No profile data returned after insert!');
          throw new Error('Profile insert succeeded but no data returned');
        }

        profileData = newProfile;
      }

      console.log('✅✅✅ Profile created successfully in database!');
      console.log('📋 Profile data:', profileData);
      console.log('👤 Profile role:', profileData.role);

      // Set the profile immediately in context
      console.log('🔄 Setting profile in context...');
      setProfile(profileData);
      setLoading(false);

      // Clear the signup flag after a delay to allow the profile to be used
      setTimeout(() => {
        console.log('🏁 Clearing isSigningUp flag');
        isSigningUp.current = false;
      }, 500);

      console.log('✅ Signup complete! Profile is set.');
      return { data, error: null };
    } catch (error) {
      console.error('❌❌❌ Signup error caught:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      setLoading(false);

      // Clear the signup flag on error
      isSigningUp.current = false;

      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      console.log('🔐 Attempting to sign in with email:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      console.log('✅ Sign in successful! User ID:', data.user.id);
      console.log('📋 Auth data:', data);
      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign in exception:', error);
      return { data: null, error };
    }
  };

  const signInWithGoogle = async (intendedRole = 'customer') => {
    try {
      console.log('🔐 Starting Google OAuth sign-in...', 'Intended role:', intendedRole);

      // Store intended role in localStorage for after OAuth redirect
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
        console.error('❌ Google OAuth error:', error);
        throw error;
      }

      console.log('✅ Google OAuth initiated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('❌ Google sign-in exception:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      // Clear state immediately
      setUser(null);
      setProfile(null);
      setVendorProfile(null);
      setSession(null);

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase signOut error:', error);
        throw error;
      }

      console.log('SignOut successful in AuthContext');
      return { error: null };
    } catch (error) {
      console.error('SignOut error in AuthContext:', error);
      return { error };
    }
  };

  const updateProfile = async (updates) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Reload profile
      await loadUserProfile(user.id);
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

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  // Refresh vendor profile (call after onboarding completion)
  const refreshVendorProfile = async () => {
    if (!user) return;
    try {
      const vendor = await getVendorProfile(user.id);
      setVendorProfile(vendor);
      return vendor;
    } catch (error) {
      console.error('Error refreshing vendor profile:', error);
      return null;
    }
  };

  const value = {
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
    isAuthenticated: !!user,
    isVendor: profile?.role === 'vendor',
    isAdmin: profile?.role === 'admin',
    isCustomer: profile?.role === 'customer',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
