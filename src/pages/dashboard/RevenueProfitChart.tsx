import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Area, ComposedChart, Line, XAxis, YAxis } from "recharts";
import React, { useState, useMemo } from "react";

interface RevenueProfitChartProps {
  dailyRevenueData: any[];
  isLoading: boolean;
}

// Chart configuration
const chartConfig = {
  revenue: {
    label: 'Jumlah Jualan',
    color: 'hsl(var(--primary))',
  },
  profit: {
    label: 'Untung Kasar',
    color: 'hsl(142, 76%, 36%)',
  },
};

// Custom Tooltip
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    const uniquePayload = payload.filter(
      (entry, index, self) => index === self.findIndex((item) => item.dataKey === entry.dataKey),
    );
    return (
      <div className="rounded-lg bg-card border border-border text-card-foreground p-3 shadow-lg">
        <div className="text-xs text-muted-foreground mb-2">{label}</div>
        {uniquePayload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm text-muted-foreground">
              {entry.dataKey === 'revenue' ? 'Jumlah Jualan' : 'Untung Kasar'}:
            </span>
            <span className="font-semibold">RM{entry.value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Period configuration
const PERIODS = {
  day: { key: 'day', label: 'Hari Ini' },
  week: { key: 'week', label: 'Minggu' },
  month: { key: 'month', label: 'Bulan' },
} as const;

type PeriodKey = keyof typeof PERIODS;

export function RevenueProfitChart({ dailyRevenueData, isLoading }: RevenueProfitChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('month');

  // Process data based on selected period
  const processedData = useMemo(() => {
    if (!dailyRevenueData || dailyRevenueData.length === 0) return [];

    const now = new Date();
    
    if (selectedPeriod === 'day') {
      // Show last 24 hours in 4-hour intervals
      const todayData = dailyRevenueData.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === now.toDateString();
      });
      
      if (todayData.length > 0) {
        return [
          { date: '00:00-04:00', revenue: todayData[0]?.revenue || 0, profit: todayData[0]?.profit || 0 },
          { date: '04:00-08:00', revenue: todayData[0]?.revenue || 0, profit: todayData[0]?.profit || 0 },
          { date: '08:00-12:00', revenue: todayData[0]?.revenue || 0, profit: todayData[0]?.profit || 0 },
          { date: '12:00-16:00', revenue: todayData[0]?.revenue || 0, profit: todayData[0]?.profit || 0 },
          { date: '16:00-20:00', revenue: todayData[0]?.revenue || 0, profit: todayData[0]?.profit || 0 },
          { date: '20:00-00:00', revenue: todayData[0]?.revenue || 0, profit: todayData[0]?.profit || 0 },
        ];
      }
      return [];
    } else if (selectedPeriod === 'week') {
      // Show last 7 days
      return dailyRevenueData.slice(-7).map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('ms-MY', { weekday: 'short' })
      }));
    } else {
      // Show current month
      return dailyRevenueData;
    }
  }, [dailyRevenueData, selectedPeriod]);

  // Calculate totals from latest data
  const latestData = processedData[processedData.length - 1] || { revenue: 0, profit: 0 };
  const totalValue = latestData.revenue + latestData.profit;

  return (
    <section className="grid grid-cols-1 gap-6 mb-8 animate-slide-up delay-600">
      <Card className="rounded-3xl border-border bg-card">
        <CardHeader className="min-h-auto gap-5 p-6 md:p-8 border-0">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Jumlah Keseluruhan</div>
              <div className="text-2xl md:text-3xl leading-none font-bold">
                RM{totalValue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center flex-wrap gap-4 md:gap-6 mt-4">
                <div className="space-y-1">
                  <div
                    className="text-[11px] font-normal flex items-center gap-1.5"
                    style={{ color: chartConfig.revenue.color }}
                  >
                    <div
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: chartConfig.revenue.color }}
                    />
                    Jumlah Jualan
                  </div>
                  <div className="text-lg md:text-xl font-bold leading-none">
                    RM{latestData.revenue.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="space-y-1">
                  <div
                    className="text-[11px] font-normal flex items-center gap-1.5"
                    style={{ color: chartConfig.profit.color }}
                  >
                    <div
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: chartConfig.profit.color }}
                    />
                    Untung Kasar
                  </div>
                  <div className="text-lg md:text-xl font-bold leading-none">
                    RM{latestData.profit.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <ToggleGroup
                type="single"
                value={selectedPeriod}
                onValueChange={(value) => value && setSelectedPeriod(value as PeriodKey)}
                className="bg-muted p-1 rounded-full"
              >
                {Object.values(PERIODS).map((period) => (
                  <ToggleGroupItem
                    key={period.key}
                    value={period.key}
                    className="px-3 md:px-4 py-2 text-xs md:text-sm data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-full transition-colors"
                  >
                    {period.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </CardHeader>
        <CardContent className="ps-2 pe-4 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : (
            <div className="h-[400px] w-full">
              <ChartContainer
                config={chartConfig}
                className="h-full w-full overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
              >
                <ComposedChart
                  data={processedData}
                  margin={{
                    top: 25,
                    right: 25,
                    left: 15,
                    bottom: 25,
                  }}
                  style={{ overflow: 'visible' }}
                >
                  <defs>
                    {/* Grid pattern */}
                    <pattern id="gridPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path
                        d="M 30 0 L 0 0 0 30"
                        fill="none"
                        stroke="hsl(var(--border))"
                        strokeWidth="0.5"
                        strokeOpacity="0.3"
                      />
                    </pattern>
                    {/* Linear gradients for areas */}
                    <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartConfig.revenue.color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={chartConfig.revenue.color} stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="profitAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartConfig.profit.color} stopOpacity="0.3" />
                      <stop offset="100%" stopColor={chartConfig.profit.color} stopOpacity="0.02" />
                    </linearGradient>
                    {/* Shadow filters for dots */}
                    <filter id="dotShadow" x="-100%" y="-100%" width="300%" height="300%">
                      <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.4)" />
                    </filter>
                    <filter id="activeDotShadow" x="-100%" y="-100%" width="300%" height="300%">
                      <feDropShadow dx="3" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.6)" />
                    </filter>
                  </defs>
                  {/* Background grid */}
                  <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="url(#gridPattern)"
                    style={{ pointerEvents: 'none' }}
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickMargin={15}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `RM${value.toLocaleString('en-MY')}`}
                    domain={['auto', 'auto']}
                    tickMargin={15}
                  />
                  <ChartTooltip content={<CustomTooltip />} />
                  {/* Area fills with gradients */}
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="transparent"
                    fill="url(#revenueAreaGradient)"
                    strokeWidth={0}
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="transparent"
                    fill="url(#profitAreaGradient)"
                    strokeWidth={0}
                    dot={false}
                  />
                  {/* Line strokes on top */}
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={chartConfig.revenue.color}
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: chartConfig.revenue.color,
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2,
                      filter: 'url(#dotShadow)',
                    }}
                    activeDot={{
                      r: 6,
                      fill: chartConfig.revenue.color,
                      strokeWidth: 2,
                      stroke: 'hsl(var(--background))',
                      filter: 'url(#activeDotShadow)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke={chartConfig.profit.color}
                    strokeWidth={2}
                    dot={{
                      r: 4,
                      fill: chartConfig.profit.color,
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 2,
                      filter: 'url(#dotShadow)',
                    }}
                    activeDot={{
                      r: 6,
                      fill: chartConfig.profit.color,
                      strokeWidth: 2,
                      stroke: 'hsl(var(--background))',
                      filter: 'url(#activeDotShadow)',
                    }}
                  />
                </ComposedChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
