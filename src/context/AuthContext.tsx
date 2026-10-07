import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { InfrastructureArchitecture } from '../types/infrastructure.ts';

interface AuthContextType {
  user: User | null;
  idToken: string | null;
  loading: boolean;
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  savedArchitectures: Array<{ id: string; name: string; updatedAt: string; data: InfrastructureArchitecture }>;
  saveToDatabase: (arch: InfrastructureArchitecture) => Promise<boolean>;
  deleteFromDatabase: (id: string) => Promise<boolean>;
  refreshSavedArchitectures: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [savedArchitectures, setSavedArchitectures] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);

          // Sync with PostgreSQL
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          // Fetch user's saved architectures
          await loadArchitectures(token);
        } catch (err) {
          console.error('Error synchronizing auth state:', err);
        }
      } else {
        setIdToken(null);
        setSavedArchitectures([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadArchitectures = async (token?: string) => {
    const activeToken = token || idToken;
    if (!activeToken) return;
    try {
      const res = await fetch('/api/architectures', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedArchitectures(data);
      }
    } catch (err) {
      console.error('Failed to load user architectures:', err);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setSyncStatus('syncing');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const token = await result.user.getIdToken();
      setIdToken(token);

      await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      await loadArchitectures(token);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Google Sign-In failed:', err);
      setSyncStatus('error');
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIdToken(null);
      setSavedArchitectures([]);
      setSyncStatus('idle');
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  };

  const saveToDatabase = async (arch: InfrastructureArchitecture): Promise<boolean> => {
    if (!idToken) return false;
    try {
      setSyncStatus('syncing');
      const res = await fetch('/api/architectures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ architecture: arch }),
      });
      if (res.ok) {
        setSyncStatus('synced');
        await loadArchitectures();
        return true;
      }
      setSyncStatus('error');
      return false;
    } catch (err) {
      console.error('Failed to save to database:', err);
      setSyncStatus('error');
      return false;
    }
  };

  const deleteFromDatabase = async (id: string): Promise<boolean> => {
    if (!idToken) return false;
    try {
      const res = await fetch(`/api/architectures/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (res.ok) {
        await loadArchitectures();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete architecture:', err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        loading,
        syncStatus,
        signInWithGoogle,
        signOutUser,
        savedArchitectures,
        saveToDatabase,
        deleteFromDatabase,
        refreshSavedArchitectures: () => loadArchitectures(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
