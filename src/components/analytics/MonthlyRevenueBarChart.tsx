import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
  TooltipModel,
  ChartData,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, TrendingUp, BarChart2 } from 'lucide-react';

// Register ChartJS components
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

export function MonthlyRevenueBarChart({
  monthlyStats,
}: MonthlyRevenueBarChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  const formatMonth = (monthKey: string) => {
    const [year, month] = monthKey.split("-");
    const monthNames = [
      "Yanvar",
      "Fevral",
      "Mart",
      "Aprel",
      "May",
      "Iyun",
      "Iyul",
      "Avgust",
      "Sentabr",
      "Oktabr",
      "Noyabr",
      "Dekabr",
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Calculate growth percentages
  const growthRates = useMemo(() => {
    if (monthlyStats.length < 2) return [];
    
    return monthlyStats.map((current, index, array) => {
      if (index === 0) return null;
      
      const previous = array[index - 1];
      const growth = ((current.totalAmount - previous.totalAmount) / previous.totalAmount) * 100;
      return {
        month: current.month,
        growth: parseFloat(growth.toFixed(1)),
        isPositive: growth >= 0,
        amountChange: current.totalAmount - previous.totalAmount
      };
    }).filter(Boolean);
  }, [monthlyStats]);

  const data: ChartData<'bar'> = {
    labels: monthlyStats.map((stat) => formatMonth(stat.month)),
    datasets: [
      {
        label: "NAQD",
        data: monthlyStats.map((stat) => stat.cashAmount),
        backgroundColor: "rgba(16, 185, 129, 0.8)",
        borderColor: "#059669",
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: "#059669",
        hoverBorderColor: "#047857",
        hoverBorderWidth: 2,
      },
      {
        label: "CLICK",
        data: monthlyStats.map((stat) => stat.clickAmount),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "#2563EB",
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: "#2563EB",
        hoverBorderColor: "#1D4ED8",
        hoverBorderWidth: 2,
      },
      {
        label: "PERECHESLENIYA",
        data: monthlyStats.map((stat) => stat.transferAmount),
        backgroundColor: "rgba(139, 92, 246, 0.8)",
        borderColor: "#7C3AED",
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: "#7C3AED",
        hoverBorderColor: "#6D28D9",
        hoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          boxWidth: 10,
        },
        onClick: () => {
          // Prevent hiding datasets on legend click
          return;
        },
      },
      title: {
        display: true,
        text: 'Oylik Daromad Taqsimoti',
        font: {
          size: 18,
          weight: 'bold',
          family: 'Inter, system-ui, -apple-system, sans-serif',
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        titleFont: { weight: 'bold' as const, size: 14 },
        bodyColor: '#4B5563',
        bodyFont: { size: 13 },
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context: TooltipItem<'bar'>) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            const monthData = monthlyStats[context.dataIndex];
            const total = monthData.totalAmount;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            
            return [
              `${label}: ${formatCurrency(value)}`,
              `Foiz: ${percentage}%`
            ];
          },
          footer: (tooltipItems: TooltipItem<'bar'>[]) => {
            if (!tooltipItems.length) return [];
            const index = tooltipItems[0].dataIndex;
            const monthData = monthlyStats[index];
            const growthInfo = growthRates[index - 1] as { growth: number; isPositive: boolean } | undefined;
            
            const footer = [
              `Jami daromad: ${formatCurrency(monthData.totalAmount)}`,
              `Buyurtmalar soni: ${monthData.orderCount} ta`,
              `O'rtacha buyurtma: ${formatCurrency(monthData.totalAmount / monthData.orderCount || 0)}`
            ];
            
            if (growthInfo) {
              const growthText = `${growthInfo.isPositive ? '+' : ''}${growthInfo.growth}%`;
              footer.push(`O'sish: ${growthText} o'tgan oyga nisbatan`);
            }
            
            return footer;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Oy',
          color: '#6B7280',
          font: {
            size: 12,
            weight: 'normal',
          },
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        stacked: false,
        grid: {
          color: 'rgba(229, 231, 235, 0.5)',
          drawOnChartArea: true,
          drawTicks: false,
        },
        title: {
          display: true,
          text: "Summa (so'm)",
          color: '#6B7280',
          font: {
            size: 12,
            weight: '500',
          },
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function (value) {
            return new Intl.NumberFormat('uz-UZ', {
              notation: 'compact',
              maximumFractionDigits: 1,
            }).format(Number(value));
          },
        },
      },
    },
    animation: {
      duration: 800,
      easing: 'easeInOutQuart',
    },
    onHover: (event, chartElement) => {
      const target = event.native?.target as HTMLElement;
      if (target) {
        target.style.cursor = chartElement[0] ? 'pointer' : 'default';
      }
    },
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRevenue = monthlyStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
    const totalOrders = monthlyStats.reduce((sum, stat) => sum + stat.orderCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Calculate month-over-month growth for the latest month
    let revenueGrowth = 0;
    let orderGrowth = 0;
    
    if (monthlyStats.length >= 2) {
      const current = monthlyStats[monthlyStats.length - 1];
      const previous = monthlyStats[monthlyStats.length - 2];
      
      revenueGrowth = ((current.totalAmount - previous.totalAmount) / (previous.totalAmount || 1)) * 100;
      orderGrowth = ((current.orderCount - previous.orderCount) / (previous.orderCount || 1)) * 100;
    }
    
    // Find best performing month
    const bestMonth = monthlyStats.length > 0 ? monthlyStats.reduce(
      (best, current) => current.totalAmount > best.totalAmount ? current : best,
      { ...monthlyStats[0] }
    ) : { month: "", totalAmount: 0, orderCount: 0 };
    
    // Calculate payment method distribution
    const paymentDistribution = {
      cash: totalRevenue > 0 ? (monthlyStats.reduce((sum, stat) => sum + stat.cashAmount, 0) / totalRevenue * 100) : 0,
      click: totalRevenue > 0 ? (monthlyStats.reduce((sum, stat) => sum + stat.clickAmount, 0) / totalRevenue * 100) : 0,
      transfer: totalRevenue > 0 ? (monthlyStats.reduce((sum, stat) => sum + stat.transferAmount, 0) / totalRevenue * 100) : 0,
    };
    
    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueGrowth: isFinite(revenueGrowth) ? revenueGrowth : 0,
      orderGrowth: isFinite(orderGrowth) ? orderGrowth : 0,
      bestMonth,
      paymentDistribution,
    };
  }, [monthlyStats]);

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Daromad Analitikasi</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <BarChart2 className="h-4 w-4" />
            <span>Oylik ko'rinish</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] mb-4">
          <Bar data={data} options={options} />
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Jami Daromad</span>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                stats.revenueGrowth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {stats.revenueGrowth >= 0 ? (
                  <ArrowUp className="h-3 w-3 mr-1" />
                ) : (
                  <ArrowDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(stats.revenueGrowth).toFixed(1)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.totalRevenue)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.totalOrders} ta buyurtma • {formatCurrency(stats.avgOrderValue)} o'rtacha
            </div>
          </div>

          <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">To'lov Turlari</span>
              <div className="text-xs text-gray-400">Foizda</div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-green-700">Naqd</span>
                  <span>{stats.paymentDistribution.cash.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full" 
                    style={{ width: `${stats.paymentDistribution.cash}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-blue-600">Click</span>
                  <span>{stats.paymentDistribution.click.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full" 
                    style={{ width: `${stats.paymentDistribution.click}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-purple-600">Perech.</span>
                  <span>{stats.paymentDistribution.transfer.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-purple-500 h-1.5 rounded-full" 
                    style={{ width: `${stats.paymentDistribution.transfer}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">O'rtacha Buyurtma</span>
              <div className="text-xs text-gray-400">O'zgarish</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(stats.avgOrderValue)}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.totalOrders} ta buyurtma
            </div>
          </div>

          <div className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">Eng Yaxshi Oy</span>
              <div className="text-xs text-gray-400">Daromad</div>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {stats.bestMonth?.month ? formatMonth(stats.bestMonth.month) : "-"}
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.bestMonth ? formatCurrency(stats.bestMonth.totalAmount) : "-"}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {stats.bestMonth?.orderCount || 0} ta buyurtma
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
                    <tr
                      key={stat.month}
                      className={index % 2 === 0 ? "bg-gray-50" : ""}
                    >
                      <td className="p-2 font-medium">
                        {formatMonth(stat.month)}
                      </td>
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




