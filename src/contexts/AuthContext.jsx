import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import {
  buildLinkKey,
  getUserProfile,
  saveUserProfile,
  ensureFamily,
  removeFamilyMembership,
  findFamilyByParentEmail
} from '../services/supabaseService';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [childName, setChildName] = useState('');
  const [parentEmail, setParentEmailState] = useState('');
  const [loading, setLoading] = useState(true);
  const [accountVersion, setAccountVersion] = useState(0);

  const linkEmail = userRole === 'caregiver' && parentEmail ? parentEmail : currentUser?.email;
  const linkKey = linkEmail && childName ? buildLinkKey(linkEmail, childName) : null;

  async function signup(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function logout() {
    setUserRole(null);
    setUserProfile(null);
    setChildName('');
    setParentEmailState('');
    setCurrentUser(null);
    setAccountVersion(v => v + 1);
    localStorage.removeItem('careconnect-role');
    localStorage.removeItem('careconnect-child');
    localStorage.removeItem('careconnect-parent-email');
    await supabase.auth.signOut();
  }

  function setRole(role) {
    setUserRole(role);
    localStorage.setItem('careconnect-role', role);
  }

  const setChild = useCallback((name) => {
    setChildName(name);
    localStorage.setItem('careconnect-child', name);
  }, []);

  const setParentEmail = useCallback((email) => {
    setParentEmailState(email);
    localStorage.setItem('careconnect-parent-email', email);
  }, []);

  async function updateProfile(data) {
    if (!currentUser) return;
    await saveUserProfile(currentUser.uid, { ...data, email: currentUser.email });
    setUserProfile(prev => ({ ...prev, ...data }));

    // Keep families + membership in sync when the link details change.
    if (data.childName !== undefined || data.parentEmail !== undefined) {
      const child = data.childName !== undefined ? data.childName : childName;
      const pEmail = data.parentEmail !== undefined ? data.parentEmail : (userRole === 'caregiver' ? parentEmail : currentUser.email);
      if (child && pEmail) {
        await ensureFamily(buildLinkKey(pEmail, child), {
          userUid: currentUser.uid,
          role: data.role || userRole,
          childName: child,
          parentEmail: pEmail,
        });
        // Resolve the canonical child_name from the parent's family so
        // both users always derive the same linkKey for queries.
        try {
          const family = await findFamilyByParentEmail(pEmail);
          if (family?.child_name && family.child_name !== child) {
            setChildName(family.child_name);
            localStorage.setItem('careconnect-child', family.child_name);
          }
        } catch {
          // non-critical — fall back to local child name
        }
      } else if (childName && parentEmail) {
        // Link removed — drop membership from the old family.
        const oldLk = buildLinkKey(parentEmail, childName);
        await removeFamilyMembership(oldLk, currentUser.uid);
      }
    }
  }

  async function loadProfile(uid) {
    try {
      const data = await getUserProfile(uid);
      if (data) {
        setUserProfile(data);
        if (data.role) {
          setUserRole(data.role);
          localStorage.setItem('careconnect-role', data.role);
        }
        if (data.parent_email) {
          setParentEmailState(data.parent_email);
          localStorage.setItem('careconnect-parent-email', data.parent_email);
        }

        // Resolve the canonical child_name from the parent's family.
        // This ensures caregivers always use the same child_name (and
        // therefore the same linkKey) as the parent, even if their
        // profiles table has a different child_name value.
        let resolvedChildName = data.child_name || '';
        const role = data.role;
        const pEmail = data.parent_email;
        if (role === 'caregiver' && pEmail) {
          try {
            const family = await findFamilyByParentEmail(pEmail);
            if (family?.child_name) {
              resolvedChildName = family.child_name;
            }
          } catch {
            // Fall back to the profile's child_name
          }
        }

        if (resolvedChildName) {
          setChildName(resolvedChildName);
          localStorage.setItem('careconnect-child', resolvedChildName);
        }
      }
    } catch (e) {
      console.error('Failed to load user profile:', e);
    }
  }

  useEffect(() => {
    const savedRole = localStorage.getItem('careconnect-role');
    const savedChild = localStorage.getItem('careconnect-child');
    const savedParentEmail = localStorage.getItem('careconnect-parent-email');
    if (savedRole) setUserRole(savedRole);
    if (savedChild) setChildName(savedChild);
    if (savedParentEmail) setParentEmailState(savedParentEmail);

    // Supabase session persistence is handled by supabase-js; this listener
    // keeps React state in sync with sign-in/sign-out/refresh events.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;
      setCurrentUser(user ? { uid: user.id, email: user.email, ...user } : null);
      if (user) {
        loadProfile(user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    currentUser,
    userRole,
    userProfile,
    childName,
    parentEmail,
    linkKey,
    accountVersion,
    signup,
    login,
    logout,
    setRole,
    setChild,
    setParentEmail,
    updateProfile,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
