import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyRevenueBarChartProps {
  monthlyStats: Array<{
    month: string;
    totalAmount: number;
    orderCount: number;
    cashAmount: number;
    clickAmount: number;
    transferAmount: number;
  }>;
}

export function MonthlyRevenueBarChart({ monthlyStats }: MonthlyRevenueBarChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const data = {
    labels: monthlyStats.map(stat => formatMonth(stat.month)),
    datasets: [
      {
        label: 'NAQD',
        data: monthlyStats.map(stat => stat.cashAmount),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
      },
      {
        label: 'CLICK',
        data: monthlyStats.map(stat => stat.clickAmount),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'PERECHESLENIYA',
        data: monthlyStats.map(stat => stat.transferAmount),
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: 'Oylik Daromad Taqsimoti',
        font: {
          size: 16,
          weight: 'bold' as const
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const monthData = monthlyStats[context.dataIndex];
            
            return [
              `${label}: ${formatCurrency(value)}`,
              `Jami buyurtmalar: ${monthData.orderCount} ta`
            ];
          },
          footer: function(tooltipItems: any[]) {
            const monthData = monthlyStats[tooltipItems[0].dataIndex];
            return `Jami daromad: ${formatCurrency(monthData.totalAmount)}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Oy'
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        title: {
          display: true,
          text: 'Summa (so\'m)'
        },
        ticks: {
          callback: function(value: any) {
            return new Intl.NumberFormat('uz-UZ', {
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(value);
          }
        }
      },
    },
  };

  // Calculate totals
  const totalRevenue = monthlyStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
  const totalOrders = monthlyStats.reduce((sum, stat) => sum + stat.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Find best month
  const bestMonth = monthlyStats.reduce((best, current) => 
    current.totalAmount > best.totalAmount ? current : best, 
    monthlyStats[0] || { month: '', totalAmount: 0, orderCount: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Oylik Daromad Analizi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96 mb-4">
          <Bar data={data} options={options} />
        </div>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-xl font-bold text-blue-700">
              {formatCurrency(totalRevenue)}
            </div>
            <div className="text-sm text-blue-600">Jami Daromad</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-700">
              {totalOrders}
            </div>
            <div className="text-sm text-green-600">Jami Buyurtmalar</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-xl font-bold text-purple-700">
              {formatCurrency(avgOrderValue)}
            </div>
            <div className="text-sm text-purple-600">O'rtacha Buyurtma</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-xl font-bold text-orange-700">
              {bestMonth.month ? formatMonth(bestMonth.month) : 'N/A'}
            </div>
            <div className="text-sm text-orange-600">Eng Yaxshi Oy</div>
            <div className="text-xs text-gray-500">
              {formatCurrency(bestMonth.totalAmount)}
            </div>
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        {monthlyStats.length > 0 && (
          <div className="mt-6">
            <h4 className="text-lg font-semibold mb-3">Oylik Tafsilotlar</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Oy</th>
                    <th className="text-right p-2">Jami</th>
                    <th className="text-right p-2">NAQD</th>
                    <th className="text-right p-2">CLICK</th>
                    <th className="text-right p-2">PERECHESLENIYA</th>
                    <th className="text-right p-2">Buyurtmalar</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((stat, index) => (
                    <tr key={stat.month} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                      <td className="p-2 font-medium">{formatMonth(stat.month)}</td>
                      <td className="p-2 text-right font-semibold">
                        {formatCurrency(stat.totalAmount)}
                      </td>
                      <td className="p-2 text-right text-green-600">
                        {formatCurrency(stat.cashAmount)}
                      </td>
                      <td className="p-2 text-right text-blue-600">
                        {formatCurrency(stat.clickAmount)}
                      </td>
                      <td className="p-2 text-right text-purple-600">
                        {formatCurrency(stat.transferAmount)}
                      </td>
                      <td className="p-2 text-right">{stat.orderCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
