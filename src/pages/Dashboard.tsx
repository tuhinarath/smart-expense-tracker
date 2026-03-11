import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import * as txService from '@/services/transactionService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user!.id;

  useEffect(() => {
    txService.seedDemoData(userId);
  }, [userId]);

  const summary = useMemo(() => txService.getSummary(userId), [userId]);
  const categories = useMemo(() => txService.getCategoryBreakdown(userId), [userId]);
  const monthly = useMemo(() => txService.getMonthlyData(userId), [userId]);
  const insights = useMemo(() => txService.getInsights(userId), [userId]);

  const summaryCards = [
    { title: 'Total Income', value: summary.totalIncome, icon: TrendingUp, colorClass: 'text-success' },
    { title: 'Total Expenses', value: summary.totalExpenses, icon: TrendingDown, colorClass: 'text-destructive' },
    { title: 'Balance', value: summary.balance, icon: Wallet, colorClass: 'text-primary' },
    { title: 'Savings Rate', value: null, display: `${summary.savingsRate.toFixed(1)}%`, icon: PiggyBank, colorClass: 'text-info' },
  ];

  const insightIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-success" />;
      default: return <Info className="h-5 w-5 text-info" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(card => (
          <Card key={card.title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.colorClass}`}>
                    {card.display ?? `$${card.value!.toLocaleString()}`}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <card.icon className={`h-5 w-5 ${card.colorClass}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map(insight => (
            <Card key={insight.id} className="shadow-sm border-l-4" style={{
              borderLeftColor: insight.type === 'warning' ? 'hsl(38 92% 50%)' : insight.type === 'success' ? 'hsl(142 71% 45%)' : 'hsl(217 91% 60%)',
            }}>
              <CardContent className="p-4 flex items-start gap-3">
                {insightIcon(insight.type)}
                <div>
                  <p className="font-semibold text-sm">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{insight.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expense Bar Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
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

        {/* Monthly Trend Line Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Line type="monotone" dataKey="expense" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} name="Expenses" />
                <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} name="Income" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" outerRadius={100} innerRadius={60} dataKey="amount" nameKey="category" paddingAngle={2}>
                    {categories.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
