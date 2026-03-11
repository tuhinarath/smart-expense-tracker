import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as txService from '@/services/transactionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, CheckCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const userId = user!.id;

  const summary = useMemo(() => txService.getSummary(userId), [userId]);
  const expenseCategories = useMemo(() => txService.getCategoryBreakdown(userId, 'expense'), [userId]);
  const incomeCategories = useMemo(() => txService.getCategoryBreakdown(userId, 'income'), [userId]);
  const monthly = useMemo(() => txService.getMonthlyData(userId, 6), [userId]);
  const insights = useMemo(() => txService.getInsights(userId), [userId]);

  const insightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning shrink-0" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-success shrink-0" />;
      default: return <Info className="h-5 w-5 text-info shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Detailed spending analysis and insights</p>
      </div>

      {/* Financial Insights */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Financial Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-muted-foreground text-sm">Add more transactions to generate insights.</p>
          ) : insights.map(insight => (
            <div key={insight.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              {insightIcon(insight.type)}
              <div>
                <p className="font-semibold text-sm">{insight.title}</p>
                <p className="text-sm text-muted-foreground">{insight.message}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-success mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Avg Monthly Income</p>
            <p className="text-xl font-bold text-success">${monthly.length > 0 ? (monthly.reduce((s, m) => s + m.income, 0) / monthly.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <TrendingDown className="h-6 w-6 text-destructive mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Avg Monthly Expenses</p>
            <p className="text-xl font-bold text-destructive">${monthly.length > 0 ? (monthly.reduce((s, m) => s + m.expense, 0) / monthly.length).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Expense Categories</p>
            <p className="text-xl font-bold">{expenseCategories.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Income Sources</p>
            <p className="text-xl font-bold">{incomeCategories.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Monthly Comparison</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Legend />
                <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={expenseCategories} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="amount" nameKey="category" paddingAngle={2}>
                  {expenseCategories.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Category Table */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Category Details</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {expenseCategories.map(cat => (
              <div key={cat.category} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                <span className="font-medium flex-1">{cat.category}</span>
                <span className="text-muted-foreground text-sm">{cat.percentage.toFixed(1)}%</span>
                <span className="font-semibold">${cat.amount.toLocaleString()}</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${cat.percentage}%`, background: cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
