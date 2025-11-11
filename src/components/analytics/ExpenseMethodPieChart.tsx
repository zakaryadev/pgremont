import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface ExpenseMethodPieChartProps {
  expenseStats: {
    cash: { amount: number };
    click: { amount: number };
    transfer: { amount: number };
    total: number;
  };
}

export function ExpenseMethodPieChart({ expenseStats }: ExpenseMethodPieChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(Math.round(amount)) + " so'm";
  };

  const data = {
    labels: ["NAQD", "CLICK", "PERECHESLENIYA"],
    datasets: [
      {
        data: [
          expenseStats.cash.amount,
          expenseStats.click.amount,
          expenseStats.transfer.amount,
        ],
        backgroundColor: [
          "#F59E0B", // Amber for cash expense
          "#3B82F6", // Blue for click
          "#8B5CF6", // Purple for transfer
        ],
        borderColor: ["#D97706", "#2563EB", "#7C3AED"],
        borderWidth: 2,
        hoverBackgroundColor: ["#FBBF24", "#60A5FA", "#A78BFA"],
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: "Rasxodlar bo'yicha taqsimot",
        font: {
          size: 16,
          weight: "bold" as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return [`${label}: ${formatCurrency(value)}`, `Foiz: ${percentage}%`];
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">Rasxodlar Analizi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-4">
          <Pie data={data} options={options} />
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(expenseStats.cash.amount)}
            </div>
            <div className="text-sm text-amber-600">NAQD</div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(expenseStats.click.amount)}
            </div>
            <div className="text-sm text-blue-600">CLICK</div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(expenseStats.transfer.amount)}
            </div>
            <div className="text-sm text-purple-600">PERECHESLENIYA</div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold">Jami Rasxod</div>
            </div>
            <div className="text-2xl font-bold text-amber-700">
              {formatCurrency(expenseStats.total)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}