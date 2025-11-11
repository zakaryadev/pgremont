import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Calendar, Download } from 'lucide-react';
import { usePaymentAnalytics, AnalyticsFilters } from '@/hooks/usePaymentAnalytics';
import { AnalyticsFiltersComponent } from '@/components/analytics/AnalyticsFiltersComponent';
import { PaymentMethodPieChart } from '@/components/analytics/PaymentMethodPieChart';
import { MonthlyRevenueBarChart } from '@/components/analytics/MonthlyRevenueBarChart';
import { useDailyExpenses } from '@/hooks/useDailyExpenses';
import { ExpenseMethodPieChart } from '@/components/analytics/ExpenseMethodPieChart';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, fetchAnalytics } = usePaymentAnalytics();
  const { items: expenses } = useDailyExpenses();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
    endDate: new Date().toISOString().split('T')[0], // Today
  });

  useEffect(() => {
    fetchAnalytics(filters);
  }, [filters, fetchAnalytics]);

  const handleBack = () => {
    navigate('/');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(Math.round(amount)) + ' so\'m';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ');
  };

  // Expense aggregates for selected date range
  const expenseStats = useMemo(() => {
    const start = new Date(filters.startDate);
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);

    const inRange = expenses.filter((e) => e.createdAt >= start && e.createdAt <= end);

    const totals = inRange.reduce(
      (acc, e) => {
        acc.total += e.totalAmount;
        if (e.paymentType === 'cash') acc.cash += e.totalAmount;
        else if (e.paymentType === 'click') acc.click += e.totalAmount;
        else if (e.paymentType === 'transfer') acc.transfer += e.totalAmount;
        return acc;
      },
      { total: 0, cash: 0, click: 0, transfer: 0 }
    );

    return totals;
  }, [expenses, filters.startDate, filters.endDate]);

  const netProfit = useMemo(() => {
    if (!analytics) return { total: 0, cash: 0, click: 0, transfer: 0 };
    const revCash = analytics.paymentMethodStats.cash.amount;
    const revClick = analytics.paymentMethodStats.click.amount;
    const revTransfer = analytics.paymentMethodStats.transfer.amount;
    const revTotal = revCash + revClick + revTransfer;

    return {
      total: revTotal - expenseStats.total,
      cash: revCash - expenseStats.cash,
      click: revClick - expenseStats.click,
      transfer: revTransfer - expenseStats.transfer,
    };
  }, [analytics, expenseStats]);

  const handleExportToExcel = () => {
    if (!analytics) return;
    try {
      const data = analytics.dailyStats.map((stat) => ({
        'Sana': new Date(stat.date).toLocaleDateString('uz-UZ'),
        'Jami': Math.round(stat.totalAmount),
        'Naqd': Math.round(stat.cashAmount),
        'Click': Math.round(stat.clickAmount),
        'Perech.': Math.round(stat.transferAmount),
        'Buyurtma': stat.orderCount,
        "O'rtacha": stat.orderCount > 0 ? Math.round(stat.totalAmount / stat.orderCount) : 0,
      }));

      const totals = analytics.dailyStats.reduce(
        (acc, s) => {
          acc.total += s.totalAmount;
          acc.cash += s.cashAmount;
          acc.click += s.clickAmount;
          acc.transfer += s.transferAmount;
          acc.orders += s.orderCount;
          return acc;
        },
        { total: 0, cash: 0, click: 0, transfer: 0, orders: 0 }
      );

      const totalsRow = {
        'Sana': 'JAMI',
        'Jami': Math.round(totals.total),
        'Naqd': Math.round(totals.cash),
        'Click': Math.round(totals.click),
        'Perech.': Math.round(totals.transfer),
        'Buyurtma': totals.orders,
        "O'rtacha": totals.orders > 0 ? Math.round(totals.total / totals.orders) : 0,
      } as any;

      const ws = XLSX.utils.json_to_sheet([...data, totalsRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kunlik daromad');

      const fileName = `analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({ title: 'Muvaffaqiyatli', description: 'Excel fayli yuklab olindi' });
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e?.message || 'Excel faylini yaratishda xatolik', variant: 'destructive' });
    }
  };

  const handleExportAllToExcel = () => {
    if (!analytics) return;
    try {
      const wb = XLSX.utils.book_new();

      const round = (n: number) => Math.round(n || 0);

      // Summary sheet
      const summaryAoA = [
        ['Hisobot'],
        ['Boshlanish sana', filters.startDate],
        ['Tugash sana', filters.endDate],
        ['Jami daromad (buyurtmalar)', round(analytics.totalRevenue)],
        ['Jami qarzdorlik', round(analytics.totalDebt)],
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryAoA);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Payment methods sheet
      const p = analytics.paymentMethodStats;
      const paymentAoA = [
        ["To'lov turi", 'Summa', 'Buyurtma soni'],
        ['NAQD', round(p.cash.amount), p.cash.count],
        ['CLICK', round(p.click.amount), p.click.count],
        ['PERECH.', round(p.transfer.amount), p.transfer.count],
      ];
      const wsPay = XLSX.utils.aoa_to_sheet(paymentAoA);
      XLSX.utils.book_append_sheet(wb, wsPay, 'To\'lov usullari');

      // Net profit sheet
      const revCash = p.cash.amount; const revClick = p.click.amount; const revTransfer = p.transfer.amount;
      const revTotal = revCash + revClick + revTransfer;
      const netAoA = [
        ['Ko\'rsatkich', 'NAQD', 'CLICK', 'PERECH.', 'JAMI'],
        ['Daromad', round(revCash), round(revClick), round(revTransfer), round(revTotal)],
        ['Rasxod', round(expenseStats.cash), round(expenseStats.click), round(expenseStats.transfer), round(expenseStats.total)],
        ['Foyda (D-R)', round(netProfit.cash), round(netProfit.click), round(netProfit.transfer), round(netProfit.total)],
      ];
      const wsNet = XLSX.utils.aoa_to_sheet(netAoA);
      XLSX.utils.book_append_sheet(wb, wsNet, 'Foyda');

      // Monthly revenue sheet
      const monthlyAoA = [
        ['Oy', 'Jami', 'Buyurtma', 'Naqd', 'Click', 'Perech.'],
        ...analytics.monthlyStats.map(m => [
          m.month,
          round(m.totalAmount),
          m.orderCount,
          round(m.cashAmount),
          round(m.clickAmount),
          round(m.transferAmount),
        ])
      ];
      const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyAoA);
      XLSX.utils.book_append_sheet(wb, wsMonthly, 'Oylik daromad');

      // Daily stats sheet
      const dailyAoA = [
        ['Sana', 'Jami', 'Naqd', 'Click', 'Perech.', 'Buyurtma', "O'rtacha"],
        ...analytics.dailyStats.map(s => [
          new Date(s.date).toLocaleDateString('uz-UZ'),
          round(s.totalAmount),
          round(s.cashAmount),
          round(s.clickAmount),
          round(s.transferAmount),
          s.orderCount,
          s.orderCount > 0 ? round(s.totalAmount / s.orderCount) : 0,
        ])
      ];
      const wsDaily = XLSX.utils.aoa_to_sheet(dailyAoA);
      XLSX.utils.book_append_sheet(wb, wsDaily, 'Kunlik daromad');

      // Expenses sheet (aggregated)
      const expAoA = [
        ["To'lov turi", 'Summa'],
        ['NAQD', round(expenseStats.cash)],
        ['CLICK', round(expenseStats.click)],
        ['PERECH.', round(expenseStats.transfer)],
        ['JAMI', round(expenseStats.total)],
      ];
      const wsExp = XLSX.utils.aoa_to_sheet(expAoA);
      XLSX.utils.book_append_sheet(wb, wsExp, 'Rasxodlar');

      const fileName = `analytics_all_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast({ title: 'Muvaffaqiyatli', description: 'Barcha ma\'lumotlar Excelga eksport qilindi' });
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e?.message || 'Excel faylini yaratishda xatolik', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Orqaga
            </Button>
            <div>
              <h1 className="text-3xl font-bold">To'lovlar Analizi</h1>
              <p className="text-muted-foreground mt-1">
                To'lov usullari va daromadlar bo'yicha batafsil tahlil
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportAllToExcel} className="flex items-center gap-2">
                <Download className="h-4 w-4" /> Excel (hammasi)
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <AnalyticsFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              onRefresh={() => fetchAnalytics(filters)}
              loading={loading}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Ma'lumotlar yuklanmoqda...</p>
            </div>
          )}

          {/* Analytics Content */}
          {analytics && !loading && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card onClick={() => navigate('/other-services?debt=all', { state: { showDebtors: true } })} className="cursor-pointer hover:bg-red-50/40">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jami Qarzdorlik</CardTitle>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(analytics.totalDebt || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Mijozlarning qarzlari jami
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">NAQD Daromad</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-700">
                      {formatCurrency(analytics.paymentMethodStats.cash.amount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.paymentMethodStats.cash.count} ta buyurtma
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CLICK Daromad</CardTitle>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(analytics.paymentMethodStats.click.amount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.paymentMethodStats.click.count} ta buyurtma
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">PERECHESLENIYA Daromad</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-700">
                      {formatCurrency(analytics.paymentMethodStats.transfer.amount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.paymentMethodStats.transfer.count} ta buyurtma
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Net Profit Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jami Foyda (Daromad - Rasxod)</CardTitle>
                    <DollarSign className={`h-4 w-4 ${netProfit.total >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${netProfit.total >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(netProfit.total)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Rasxod: {formatCurrency(expenseStats.total)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">NAQD Foyda</CardTitle>
                    <DollarSign className={`h-4 w-4 ${netProfit.cash >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${netProfit.cash >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatCurrency(netProfit.cash)}
                    </div>
                    <p className="text-xs text-muted-foreground">Daromad: {formatCurrency(analytics.paymentMethodStats.cash.amount)} · Rasxod: {formatCurrency(expenseStats.cash)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">CLICK Foyda</CardTitle>
                    <DollarSign className={`h-4 w-4 ${netProfit.click >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${netProfit.click >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {formatCurrency(netProfit.click)}
                    </div>
                    <p className="text-xs text-muted-foreground">Daromad: {formatCurrency(analytics.paymentMethodStats.click.amount)} · Rasxod: {formatCurrency(expenseStats.click)}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">PERECHESLENIYA Foyda</CardTitle>
                    <DollarSign className={`h-4 w-4 ${netProfit.transfer >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${netProfit.transfer >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                      {formatCurrency(netProfit.transfer)}
                    </div>
                    <p className="text-xs text-muted-foreground">Daromad: {formatCurrency(analytics.paymentMethodStats.transfer.amount)} · Rasxod: {formatCurrency(expenseStats.transfer)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Payment Methods Pie Chart */}
                <PaymentMethodPieChart paymentMethodStats={analytics.paymentMethodStats} />
                
                {/* Monthly Revenue Bar Chart */}
                <MonthlyRevenueBarChart monthlyStats={analytics.monthlyStats} />
              </div>

              {/* Expenses Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <ExpenseMethodPieChart expenseStats={{
                  cash: { amount: expenseStats.cash },
                  click: { amount: expenseStats.click },
                  transfer: { amount: expenseStats.transfer },
                  total: expenseStats.total,
                }} />
              </div>

              {/* Daily Stats Table */}
              {analytics.dailyStats.length > 0 && (
                <Card>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Kunlik Daromadlar
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={handleExportToExcel} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Excel
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3">Sana</th>
                            <th className="text-right p-3">Jami</th>
                            <th className="text-right p-3 text-green-700">Naqd</th>
                            <th className="text-right p-3 text-blue-700">Click</th>
                            <th className="text-right p-3 text-purple-700">Perech.</th>
                            <th className="text-right p-3">Buyurtma</th>
                            <th className="text-right p-3">O'rtacha</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.dailyStats.slice(-10).reverse().map((stat, index) => (
                            <tr key={stat.date} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                              <td className="p-3 font-medium">
                                {formatDate(stat.date)}
                              </td>
                              <td className="p-3 text-right font-semibold">
                                {formatCurrency(stat.totalAmount)}
                              </td>
                              <td className="p-3 text-right text-green-700">
                                {formatCurrency(stat.cashAmount)}
                              </td>
                              <td className="p-3 text-right text-blue-700">
                                {formatCurrency(stat.clickAmount)}
                              </td>
                              <td className="p-3 text-right text-purple-700">
                                {formatCurrency(stat.transferAmount)}
                              </td>
                              <td className="p-3 text-right">
                                {stat.orderCount}
                              </td>
                              <td className="p-3 text-right text-blue-600">
                                {formatCurrency(stat.totalAmount / stat.orderCount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No Data Message */}
              {analytics.totalRevenue === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Ma'lumotlar topilmadi</h3>
                    <p className="text-muted-foreground">
                      Tanlangan sana oralig'ida hech qanday buyurtma topilmadi.
                      Boshqa sana oralig'ini tanlab ko'ring.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

