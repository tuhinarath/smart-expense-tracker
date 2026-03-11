import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as txService from '@/services/transactionService';
import { CATEGORIES, TransactionType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function AddTransactionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (editId) {
      const transactions = txService.getTransactions(user!.id);
      const tx = transactions.find(t => t.id === editId);
      if (tx) {
        setType(tx.type);
        setAmount(tx.amount.toString());
        setCategory(tx.category);
        setDescription(tx.description);
        setDate(tx.date);
      }
    }
  }, [editId, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description) {
      toast.error('Please fill all fields');
      return;
    }

    const data = {
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
    };

    if (editId) {
      txService.updateTransaction(editId, user!.id, data);
      toast.success('Transaction updated');
    } else {
      txService.addTransaction(user!.id, data);
      toast.success('Transaction added');
    }
    navigate('/transactions');
  };

  const categories = type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{editId ? 'Edit' : 'Add'} Transaction</h1>
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type Toggle */}
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="flex gap-2">
                <Button type="button" variant={type === 'expense' ? 'default' : 'outline'} className="flex-1" onClick={() => { setType('expense'); setCategory(''); }}>
                  Expense
                </Button>
                <Button type="button" variant={type === 'income' ? 'default' : 'outline'} className="flex-1" onClick={() => { setType('income'); setCategory(''); }}>
                  Income
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What was this for?" rows={2} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">{editId ? 'Update' : 'Add'} Transaction</Button>
              <Button type="button" variant="outline" onClick={() => navigate('/transactions')}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
