import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { usePaymentAnalytics, AnalyticsFilters } from '@/hooks/usePaymentAnalytics';
import { AnalyticsFiltersComponent } from '@/components/analytics/AnalyticsFiltersComponent';
import { PaymentMethodPieChart } from '@/components/analytics/PaymentMethodPieChart';
import { MonthlyRevenueBarChart } from '@/components/analytics/MonthlyRevenueBarChart';

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { analytics, loading, error, fetchAnalytics } = usePaymentAnalytics();
  
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
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ');
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
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Jami Daromad</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics.totalRevenue)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
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

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Payment Methods Pie Chart */}
                <PaymentMethodPieChart paymentMethodStats={analytics.paymentMethodStats} />
                
                {/* Monthly Revenue Bar Chart */}
                <MonthlyRevenueBarChart monthlyStats={analytics.monthlyStats} />
              </div>

              {/* Daily Stats Table */}
              {analytics.dailyStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Kunlik Daromadlar
                    </CardTitle>
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
