import { Transaction, TransactionType, Summary, CategoryBreakdown, MonthlyData, Insight } from '@/types';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

const TRANSACTIONS_KEY = 'expense_tracker_transactions';

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#10b981',
  Transport: '#3b82f6',
  Shopping: '#f59e0b',
  Bills: '#ef4444',
  Entertainment: '#8b5cf6',
  Healthcare: '#ec4899',
  Salary: '#06b6d4',
  Freelance: '#14b8a6',
  Other: '#6b7280',
};

function getAll(): Transaction[] {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveAll(transactions: Transaction[]) {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function getTransactions(userId: string): Transaction[] {
  return getAll().filter(t => t.user_id === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addTransaction(userId: string, data: Omit<Transaction, 'id' | 'user_id' | 'created_at'>): Transaction {
  const transaction: Transaction = {
    ...data,
    id: crypto.randomUUID(),
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  const all = getAll();
  all.push(transaction);
  saveAll(all);
  return transaction;
}

export function updateTransaction(id: string, userId: string, data: Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>): Transaction | null {
  const all = getAll();
  const idx = all.findIndex(t => t.id === id && t.user_id === userId);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data };
  saveAll(all);
  return all[idx];
}

export function deleteTransaction(id: string, userId: string): boolean {
  const all = getAll();
  const filtered = all.filter(t => !(t.id === id && t.user_id === userId));
  if (filtered.length === all.length) return false;
  saveAll(filtered);
  return true;
}

export function getSummary(userId: string): Summary {
  const transactions = getTransactions(userId);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
  return { totalIncome, totalExpenses, balance, savingsRate };
}

export function getCategoryBreakdown(userId: string, type: TransactionType = 'expense'): CategoryBreakdown[] {
  const transactions = getTransactions(userId).filter(t => t.type === type);
  const total = transactions.reduce((s, t) => s + t.amount, 0);
  const grouped: Record<string, number> = {};
  transactions.forEach(t => {
    grouped[t.category] = (grouped[t.category] || 0) + t.amount;
  });
  return Object.entries(grouped)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
      color: CATEGORY_COLORS[category] || '#6b7280',
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getMonthlyData(userId: string, months: number = 6): MonthlyData[] {
  const transactions = getTransactions(userId);
  const result: MonthlyData[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const monthTransactions = transactions.filter(t => {
      const d = parseISO(t.date);
      return isWithinInterval(d, { start, end });
    });
    result.push({
      month: format(date, 'MMM yyyy'),
      income: monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }
  return result;
}

export function getInsights(userId: string): Insight[] {
  const insights: Insight[] = [];
  const summary = getSummary(userId);
  const categories = getCategoryBreakdown(userId, 'expense');
  const monthly = getMonthlyData(userId, 2);

  if (summary.savingsRate > 0) {
    insights.push({
      id: '1',
      type: summary.savingsRate >= 20 ? 'success' : 'info',
      title: 'Savings Rate',
      message: `You saved ${summary.savingsRate.toFixed(0)}% of your income${summary.savingsRate >= 20 ? '. Great job!' : '. Try to save at least 20%.'}`,
      icon: summary.savingsRate >= 20 ? '🎉' : '💡',
    });
  }

  if (categories.length > 0) {
    insights.push({
      id: '2',
      type: 'info',
      title: 'Top Spending',
      message: `Your highest spending category is ${categories[0].category} at $${categories[0].amount.toLocaleString()}.`,
      icon: '📊',
    });
  }

  if (monthly.length >= 2 && monthly[0].expense > 0 && monthly[1].expense > 0) {
    const change = ((monthly[1].expense - monthly[0].expense) / monthly[0].expense) * 100;
    if (change > 20) {
      insights.push({
        id: '3',
        type: 'warning',
        title: 'Spending Spike',
        message: `Your expenses increased by ${change.toFixed(0)}% compared to last month.`,
        icon: '⚠️',
      });
    } else if (change < -10) {
      insights.push({
        id: '4',
        type: 'success',
        title: 'Spending Down',
        message: `Your expenses decreased by ${Math.abs(change).toFixed(0)}% compared to last month. Keep it up!`,
        icon: '✅',
      });
    }
  }

  if (summary.balance < 0) {
    insights.push({
      id: '5',
      type: 'warning',
      title: 'Negative Balance',
      message: 'You are spending more than you earn. Review your expenses.',
      icon: '🚨',
    });
  }

  // Category-specific insights
  categories.forEach(cat => {
    if (cat.percentage > 35) {
      insights.push({
        id: `cat-${cat.category}`,
        type: 'warning',
        title: 'Overspending Alert',
        message: `You spent ${cat.percentage.toFixed(0)}% of your expenses on ${cat.category}. Consider reducing.`,
        icon: '💸',
      });
    }
  });

  return insights.slice(0, 5);
}

export function seedDemoData(userId: string) {
  const existing = getTransactions(userId);
  if (existing.length > 0) return;

  const now = new Date();
  const demoTransactions: Omit<Transaction, 'id' | 'user_id' | 'created_at'>[] = [
    { amount: 5000, type: 'income', category: 'Salary', description: 'Monthly salary', date: format(subMonths(now, 0), 'yyyy-MM-dd') },
    { amount: 1200, type: 'income', category: 'Freelance', description: 'Web design project', date: format(subMonths(now, 0), 'yyyy-MM-dd') },
    { amount: 450, type: 'expense', category: 'Food', description: 'Groceries', date: format(subMonths(now, 0), 'yyyy-MM-dd') },
    { amount: 120, type: 'expense', category: 'Transport', description: 'Gas & parking', date: format(subMonths(now, 0), 'yyyy-MM-dd') },
    { amount: 250, type: 'expense', category: 'Shopping', description: 'New clothes', date: format(subMonths(now, 0), 'yyyy-MM-dd') },
    { amount: 180, type: 'expense', category: 'Bills', description: 'Electric bill', date: format(subMonths(now, 0), 'yyyy-MM-dd') },
    { amount: 85, type: 'expense', category: 'Entertainment', description: 'Movie & dinner', date: format(subMonths(now, 0), 'yyyy-MM-dd') },
    { amount: 200, type: 'expense', category: 'Healthcare', description: 'Doctor visit', date: format(subMonths(now, 0), 'yyyy-MM-dd') },
    { amount: 5000, type: 'income', category: 'Salary', description: 'Monthly salary', date: format(subMonths(now, 1), 'yyyy-MM-dd') },
    { amount: 380, type: 'expense', category: 'Food', description: 'Groceries & eating out', date: format(subMonths(now, 1), 'yyyy-MM-dd') },
    { amount: 100, type: 'expense', category: 'Transport', description: 'Public transit', date: format(subMonths(now, 1), 'yyyy-MM-dd') },
    { amount: 600, type: 'expense', category: 'Shopping', description: 'Electronics', date: format(subMonths(now, 1), 'yyyy-MM-dd') },
    { amount: 175, type: 'expense', category: 'Bills', description: 'Internet + phone', date: format(subMonths(now, 1), 'yyyy-MM-dd') },
    { amount: 5000, type: 'income', category: 'Salary', description: 'Monthly salary', date: format(subMonths(now, 2), 'yyyy-MM-dd') },
    { amount: 800, type: 'income', category: 'Freelance', description: 'Logo design', date: format(subMonths(now, 2), 'yyyy-MM-dd') },
    { amount: 520, type: 'expense', category: 'Food', description: 'Groceries', date: format(subMonths(now, 2), 'yyyy-MM-dd') },
    { amount: 300, type: 'expense', category: 'Entertainment', description: 'Concert tickets', date: format(subMonths(now, 2), 'yyyy-MM-dd') },
    { amount: 150, type: 'expense', category: 'Transport', description: 'Car maintenance', date: format(subMonths(now, 2), 'yyyy-MM-dd') },
    { amount: 5000, type: 'income', category: 'Salary', description: 'Monthly salary', date: format(subMonths(now, 3), 'yyyy-MM-dd') },
    { amount: 400, type: 'expense', category: 'Food', description: 'Groceries', date: format(subMonths(now, 3), 'yyyy-MM-dd') },
    { amount: 900, type: 'expense', category: 'Bills', description: 'Insurance', date: format(subMonths(now, 3), 'yyyy-MM-dd') },
    { amount: 5000, type: 'income', category: 'Salary', description: 'Monthly salary', date: format(subMonths(now, 4), 'yyyy-MM-dd') },
    { amount: 350, type: 'expense', category: 'Food', description: 'Groceries', date: format(subMonths(now, 4), 'yyyy-MM-dd') },
    { amount: 200, type: 'expense', category: 'Shopping', description: 'Books', date: format(subMonths(now, 4), 'yyyy-MM-dd') },
    { amount: 5000, type: 'income', category: 'Salary', description: 'Monthly salary', date: format(subMonths(now, 5), 'yyyy-MM-dd') },
    { amount: 500, type: 'expense', category: 'Food', description: 'Dining out', date: format(subMonths(now, 5), 'yyyy-MM-dd') },
    { amount: 250, type: 'expense', category: 'Entertainment', description: 'Gaming', date: format(subMonths(now, 5), 'yyyy-MM-dd') },
  ];

  demoTransactions.forEach(t => addTransaction(userId, t));
}
