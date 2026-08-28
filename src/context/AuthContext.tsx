import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { User } from '../types';
import * as db from '../lib/db';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (email: string, password: string) => boolean;
  logout: () => void;
  forgotPassword: (email: string) => { success: boolean; message: string };
  resetPassword: (token: string, newPassword: string) => { success: boolean; message: string };
  sessionTimeout: number | null;
  registerUser: (user: User, password: string) => Promise<void>;
  updateUser: (userId: string, updates: Partial<User>, newPassword?: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  getCredentials: () => Record<string, string>;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  restoreUsers: (users: User[]) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_DURATION = 30 * 60 * 1000;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const SESSION_KEY = 'health_sys_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(null);
  const [resetTokens] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const lastActivity = useRef<number>(Date.now());
  const isPrinting = useRef<boolean>(false);

  // Load users + credentials from Supabase on mount, and restore session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { users: loadedUsers, credentials: loadedCreds } = await db.fetchUsers();
        if (cancelled) return;
        if (loadedUsers.length === 0) {
          const admin: User = { id: 'u1', name: 'Dr. Maria Santos', email: 'admin@gmail.com', role: 'admin', department: 'Administration', adminId: 'ADM-2024-001', status: 'active', createdAt: '2024-01-10' };
          await db.upsertUser(admin, 'admin123');
          setUsers([admin]);
          setCredentials({ 'admin@gmail.com': 'admin123' });
        } else {
          setUsers(loadedUsers);
          setCredentials(loadedCreds);
        }

        // Restore session from sessionStorage if still valid
        try {
          const stored = sessionStorage.getItem(SESSION_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as { userId: string; expiry: number };
            if (parsed.expiry > Date.now()) {
              const user = loadedUsers.length > 0
                ? loadedUsers
                : [{ id: 'u1', name: 'Dr. Maria Santos', email: 'admin@gmail.com', role: 'admin', department: 'Administration', adminId: 'ADM-2024-001', status: 'active', createdAt: '2024-01-10' } as User];
              const restored = user.find((u) => u.id === parsed.userId);
              if (restored && restored.status === 'active') {
                lastActivity.current = Date.now();
                setCurrentUser(restored);
              }
            } else {
              sessionStorage.removeItem(SESSION_KEY);
            }
          }
        } catch { /* ignore parse errors */ }

        setLoading(false);
      } catch (err) {
        console.error('AuthContext load failed:', err);
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Activity-based session: track user interaction and check expiry on an interval.
  useEffect(() => {
    const updateActivity = () => { lastActivity.current = Date.now(); };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, updateActivity, { passive: true }));

    // beforeprint / afterprint fire when the browser's print dialog opens/closes.
    // While printing, the event loop is blocked so activity events stop firing.
    // We set a flag so the interval skips the timeout check during printing,
    // and reset activity when printing ends.
    const onBeforePrint = () => {
      isPrinting.current = true;
      lastActivity.current = Date.now();
    };
    const onAfterPrint = () => {
      isPrinting.current = false;
      lastActivity.current = Date.now();
    };
    // Safety net: some browsers don't fire afterprint reliably. When the
    // window regains focus or visibility, clear the printing flag and reset
    // activity so the idle timer starts fresh.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isPrinting.current = false;
        (window as any).__healthSysPrinting = false;
        lastActivity.current = Date.now();
      }
    };
    const onFocus = () => {
      isPrinting.current = false;
      (window as any).__healthSysPrinting = false;
      lastActivity.current = Date.now();
    };
    window.addEventListener('beforeprint', onBeforePrint);
    window.addEventListener('afterprint', onAfterPrint);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onFocus);

    const interval = setInterval(() => {
      if (!currentUser) return;
      // Skip the idle-timeout check while any print dialog is open. The
      // event loop is blocked during printing so activity events stop
      // firing. Both the main-window beforeprint/afterprint listeners
      // and the iframe-based printHtml() set this flag.
      const printing = isPrinting.current || (window as any).__healthSysPrinting === true;
      if (printing) return;
      const elapsed = Date.now() - lastActivity.current;
      if (elapsed >= SESSION_DURATION) {
        setCurrentUser(null);
        setSessionTimeout(null);
        sessionStorage.removeItem(SESSION_KEY);
      } else {
        setSessionTimeout(lastActivity.current + SESSION_DURATION);
      }
    }, 5000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, updateActivity));
      window.removeEventListener('beforeprint', onBeforePrint);
      window.removeEventListener('afterprint', onAfterPrint);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [currentUser?.id]);

  // Persist / clear session in sessionStorage — updated on activity so expiry stays fresh
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        userId: currentUser.id,
        expiry: lastActivity.current + SESSION_DURATION,
      }));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [currentUser?.id]);

  // Safety net: if currentUser becomes null but a valid session still exists in
  // sessionStorage, restore it immediately. This catches any unexpected state
  // loss (e.g. caused by the print dialog disrupting React's render cycle).
  useEffect(() => {
    if (currentUser || users.length === 0) return;
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as { userId: string; expiry: number };
      if (parsed.expiry <= Date.now()) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      const restored = users.find((u) => u.id === parsed.userId);
      if (restored && restored.status === 'active') {
        lastActivity.current = Date.now();
        setCurrentUser(restored);
      }
    } catch { /* ignore */ }
  }, [currentUser, users]);

  const login = useCallback((email: string, password: string): boolean => {
    const normalizedEmail = normalizeEmail(email);
    const expectedPassword = credentials[normalizedEmail];
    if (!expectedPassword || expectedPassword !== password) return false;
    const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (!user || user.status === 'inactive') return false;
    lastActivity.current = Date.now();
    setCurrentUser(user);
    return true;
  }, [credentials, users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setSessionTimeout(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const forgotPassword = useCallback((email: string): { success: boolean; message: string } => {
    const normalizedEmail = normalizeEmail(email);
    const user = users.find((u) => normalizeEmail(u.email) === normalizedEmail);
    if (!user) return { success: false, message: 'No account found with that email address.' };
    const token = Math.random().toString(36).substring(2, 15);
    resetTokens.set(token, normalizedEmail);
    return { success: true, message: `Password reset instructions sent to ${email}. (Demo token: ${token})` };
  }, [users, resetTokens]);

  const resetPassword = useCallback((token: string, newPassword: string): { success: boolean; message: string } => {
    if (!newPassword || newPassword.length < 6) return { success: false, message: 'Password must be at least 6 characters.' };
    const email = resetTokens.get(token);
    if (!email) return { success: false, message: 'Invalid or expired reset token.' };
    resetTokens.delete(token);
    setCredentials((prev) => {
      const next = { ...prev, [email]: newPassword };
      // Persist password change to the user row
      const user = users.find((u) => normalizeEmail(u.email) === email);
      if (user) db.upsertUser(user, newPassword).catch((e) => console.error('persist reset password:', e));
      return next;
    });
    return { success: true, message: 'Password reset successfully. You can now sign in.' };
  }, [resetTokens, users]);

  const registerUser = useCallback(async (user: User, password: string): Promise<void> => {
    setUsers((prev) => [...prev, user]);
    setCredentials((prev) => ({ ...prev, [normalizeEmail(user.email)]: password.trim() }));
    await db.upsertUser(user, password.trim());
  }, []);

  const updateUser = useCallback(async (userId: string, updates: Partial<User>, newPassword?: string): Promise<void> => {
    let updatedUser: User | undefined;
    setUsers((prev) => {
      const next = prev.map((u) => u.id === userId ? { ...u, ...updates } : u);
      updatedUser = next.find((u) => u.id === userId);
      if (updatedUser?.id === currentUser?.id) setCurrentUser(updatedUser ?? null);
      return next;
    });
    if (updates.email) {
      const oldUser = users.find((u) => u.id === userId);
      if (oldUser && oldUser.email !== updates.email) {
        setCredentials((prev) => {
          const next = { ...prev };
          delete next[normalizeEmail(oldUser.email)];
          return next;
        });
      }
    }
    if (newPassword?.trim()) {
      const user = users.find((u) => u.id === userId);
      if (user) {
        setCredentials((prev) => ({ ...prev, [normalizeEmail(updates.email || user.email)]: newPassword.trim() }));
      }
    }
    if (updatedUser) {
      const pw = newPassword?.trim() || credentials[normalizeEmail(updatedUser.email)] || '';
      await db.upsertUser(updatedUser, pw);
    }
  }, [users, credentials, currentUser?.id]);

  const toggleUserStatus = useCallback(async (userId: string): Promise<void> => {
    let updatedUser: User | undefined;
    setUsers((prev) => {
      const next = prev.map((u) => u.id === userId ? { ...u, status: (u.status === 'active' ? 'inactive' : 'active') as User['status'] } : u);
      updatedUser = next.find((u) => u.id === userId);
      return next;
    });
    if (updatedUser) {
      const pw = credentials[normalizeEmail(updatedUser.email)] || '';
      await db.upsertUser(updatedUser, pw);
    }
  }, [credentials]);

  const getCredentials = useCallback(() => credentials, [credentials]);

  const restoreUsers = useCallback((restoredUsers: User[]) => {
    setUsers(restoredUsers);
    db.upsertUsers(restoredUsers, credentials).catch((e) => console.error('persist restoreUsers:', e));
  }, [credentials]);

  return (
    <AuthContext.Provider value={{
      currentUser, users, login, logout, forgotPassword, resetPassword, sessionTimeout,
      registerUser, updateUser, toggleUserStatus, getCredentials, setUsers, restoreUsers, loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
