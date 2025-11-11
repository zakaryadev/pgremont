import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Filter, RefreshCw } from "lucide-react";
import { AnalyticsFilters } from "@/hooks/usePaymentAnalytics";

interface AnalyticsFiltersProps {
  filters: AnalyticsFilters;
  onFiltersChange: (filters: AnalyticsFilters) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function AnalyticsFiltersComponent({
  filters,
  onFiltersChange,
  onRefresh,
  loading,
}: AnalyticsFiltersProps) {
  // Sana o'zgarishi
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  // To'lov turi o'zgarishi
  const handlePaymentMethodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      paymentMethod:
        value === "all" ? undefined : (value as "cash" | "click" | "transfer"),
    });
  };

  // Ertangi sana (string formatda)
  const getTomorrowDateString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Tezkor sanalarni o'rnatish
  const setQuickDateRange = (
    range: "today" | "week" | "month" | "quarter" | "year"
  ) => {
    const today = new Date();
    let startDate = new Date();

    switch (range) {
      case "today":
        startDate = new Date(today);
        break;
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    const endDate = new Date(today); // Bugungi sana oxirgi kun sifatida

    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    });
  };

  // Sana formatlash yordamchisi
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return "";
    return typeof date === "string" ? date : date.toISOString().split("T")[0];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Analiz Filtrlari
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Boshlanish sanasi */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Boshlanish sanasi</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={formatDate(filters.startDate)}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tugash sanasi */}
          <div className="space-y-2">
            <Label htmlFor="endDate">Tugash sanasi</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="endDate"
                type="date"
                value={formatDate(filters.endDate)}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* To'lov turi */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">To'lov usuli</Label>
            <Select
              value={filters.paymentMethod || "all"}
              onValueChange={handlePaymentMethodChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="To'lov usulini tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha usullar</SelectItem>
                <SelectItem value="cash">NAQD</SelectItem>
                <SelectItem value="click">CLICK</SelectItem>
                <SelectItem value="transfer">PERECHISLENIYA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Yangilash tugmasi */}
          <div className="space-y-2">
            <Label>Amallar</Label>
            <div className="flex gap-2">
              <Button
                onClick={onRefresh}
                disabled={loading}
                className="flex-1"
                size="sm"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Yangilash
              </Button>
            </div>
          </div>
        </div>

        {/* Tezkor sanalar */}
        <div className="mt-4">
          <Label className="text-sm font-medium mb-2 block">
            Tezkor sana tanlash
          </Label>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Bugun", value: "today" },
              { label: "Oxirgi 7 kun", value: "week" },
              { label: "Oxirgi oy", value: "month" },
              { label: "Oxirgi 3 oy", value: "quarter" },
              { label: "Oxirgi yil", value: "year" },
            ].map((btn) => (
              <Button
                key={btn.value}
                variant="outline"
                size="sm"
                onClick={() => setQuickDateRange(btn.value as any)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Hozirgi filtrlar */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Joriy filtrlar:</strong>
            <br />
            Sana:{" "}
            {filters.startDate && filters.endDate
              ? `${new Date(filters.startDate).toLocaleDateString(
                  "uz-UZ"
                )} - ${new Date(filters.endDate).toLocaleDateString("uz-UZ")}`
              : "Tanlanmagan"}
            <br />
            To'lov usuli:{" "}
            {filters.paymentMethod
              ? filters.paymentMethod === "cash"
                ? "NAQD"
                : filters.paymentMethod === "click"
                ? "CLICK"
                : "PERECHISLENIYA"
              : "Barcha usullar"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}





