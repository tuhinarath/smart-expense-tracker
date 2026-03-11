export type TransactionType = 'income' | 'expense';

export const CATEGORIES = {
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Other'],
  income: ['Salary', 'Freelance', 'Other'],
} as const;

export const ALL_CATEGORIES = [...CATEGORIES.expense, ...CATEGORIES.income] as const;

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Summary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  savingsRate: number;
}

export interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface Insight {
  id: string;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  icon: string;
}
