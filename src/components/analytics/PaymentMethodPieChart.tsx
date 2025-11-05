import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface PaymentMethodPieChartProps {
  paymentMethodStats: {
    cash: { amount: number; count: number };
    click: { amount: number; count: number };
    transfer: { amount: number; count: number };
  };
}

export function PaymentMethodPieChart({
  paymentMethodStats,
}: PaymentMethodPieChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  const data = {
    labels: ["NAQD", "CLICK", "PERECHESLENIYA"],
    datasets: [
      {
        data: [
          paymentMethodStats.cash.amount,
          paymentMethodStats.click.amount,
          paymentMethodStats.transfer.amount,
        ],
        backgroundColor: [
          "#10B981", // Green for cash
          "#3B82F6", // Blue for click
          "#8B5CF6", // Purple for transfer
        ],
        borderColor: ["#059669", "#2563EB", "#7C3AED"],
        borderWidth: 2,
        hoverBackgroundColor: ["#34D399", "#60A5FA", "#A78BFA"],
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
        text: "To'lov usullari bo'yicha daromad taqsimoti",
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
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage = ((value / total) * 100).toFixed(1);

            // Get count for this payment method
            let count = 0;
            if (label === "NAQD") count = paymentMethodStats.cash.count;
            else if (label === "CLICK") count = paymentMethodStats.click.count;
            else if (label === "PERECHESLENIYA")
              count = paymentMethodStats.transfer.count;

            return [
              `${label}: ${formatCurrency(value)}`,
              `Foiz: ${percentage}%`,
              `Buyurtmalar soni: ${count} ta`,
            ];
          },
        },
      },
    },
  };

  const totalAmount =
    paymentMethodStats.cash.amount +
    paymentMethodStats.click.amount +
    paymentMethodStats.transfer.amount;

  const totalCount =
    paymentMethodStats.cash.count +
    paymentMethodStats.click.count +
    paymentMethodStats.transfer.count;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">To'lov Usullari Analizi</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-4">
          <Pie data={data} options={options} />
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(paymentMethodStats.cash.amount)}
            </div>
            <div className="text-sm text-green-600">NAQD</div>
            <div className="text-xs text-gray-500">
              {paymentMethodStats.cash.count} ta buyurtma
            </div>
          </div>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(paymentMethodStats.click.amount)}
            </div>
            <div className="text-sm text-blue-600">CLICK</div>
            <div className="text-xs text-gray-500">
              {paymentMethodStats.click.count} ta buyurtma
            </div>
          </div>

          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-700">
              {formatCurrency(paymentMethodStats.transfer.amount)}
            </div>
            <div className="text-sm text-purple-600">PERECHESLENIYA</div>
            <div className="text-xs text-gray-500">
              {paymentMethodStats.transfer.count} ta buyurtma
            </div>
          </div>
        </div>

        {/* Total Summary */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold">Jami Daromad</div>
              <div className="text-sm text-gray-600">
                {totalCount} ta to'lov tarixi
              </div>
            </div>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



