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
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  const handlePaymentMethodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      paymentMethod:
        value === "all" ? undefined : (value as "cash" | "click" | "transfer"),
    });
  };

  const setQuickDateRange = (
    range: "today" | "week" | "month" | "quarter" | "year"
  ) => {
    const today = new Date();
    let startDate: Date;
    let endDate = new Date(today);

    switch (
      range // Fix: Ensure startDate is correctly set for each range
    ) {
      // For all cases, endDate should be today + 1 day to include today's full data
      case "today":
        startDate = new Date(today);
        break;
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "quarter":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default:
        startDate = new Date(today);
    }
    endDate.setDate(endDate.getDate() + 1); // Add one day to endDate to include the full day

    onFiltersChange({
      ...filters,
      startDate: startDate.toISOString().split("T")[0],
      // Fix: Ensure endDate is inclusive by setting it to the end of the day
      endDate: new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      ).toISOString(),
    });
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
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Boshlanish sanasi</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleDateChange("startDate", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate">Tugash sanasi</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleDateChange("endDate", e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Payment Method */}
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
                <SelectItem value="transfer">PERECHESLENIYA</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
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

        {/* Quick Date Range Buttons */}
        <div className="mt-4">
          <Label className="text-sm font-medium mb-2 block">
            Tezkor sana tanlash
          </Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange("today")}
            >
              Bugun
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange("week")}
            >
              Oxirgi 7 kun
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange("month")}
            >
              Oxirgi oy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange("quarter")}
            >
              Oxirgi 3 oy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateRange("year")}
            >
              Oxirgi yil
            </Button>
          </div>
        </div>

        {/* Current Filter Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <strong>Joriy filtrlar:</strong>
            <br />
            Sana: {new Date(filters.startDate).toLocaleDateString(
              "uz-UZ"
            )} - {new Date(filters.endDate).toLocaleDateString("uz-UZ")}
            <br />
            To'lov usuli:{" "}
            {filters.paymentMethod
              ? filters.paymentMethod === "cash"
                ? "NAQD"
                : filters.paymentMethod === "click"
                ? "CLICK"
                : "PERECHESLENIYA"
              : "Barcha usullar"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
