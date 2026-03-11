import { User, AuthState } from '@/types';

const USERS_KEY = 'expense_tracker_users';
const AUTH_KEY = 'expense_tracker_auth';

interface StoredUser extends User {
  password: string;
}

function getUsers(): StoredUser[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setAuth(user: User | null) {
  if (user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function getAuthState(): AuthState {
  const data = localStorage.getItem(AUTH_KEY);
  if (data) {
    return { user: JSON.parse(data), isAuthenticated: true };
  }
  return { user: null, isAuthenticated: false };
}

export function signup(name: string, email: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    return { success: false, error: 'Email already registered' };
  }
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
  };
  saveUsers([...users, newUser]);
  const { password: _, ...user } = newUser;
  setAuth(user);
  return { success: true, user };
}

export function login(email: string, password: string): { success: boolean; error?: string; user?: User } {
  const users = getUsers();
  const found = users.find(u => u.email === email && u.password === password);
  if (!found) {
    return { success: false, error: 'Invalid email or password' };
  }
  const { password: _, ...user } = found;
  setAuth(user);
  return { success: true, user };
}

export function logout() {
  setAuth(null);
}
