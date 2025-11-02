import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowDown, ArrowUp, MoreHorizontal, Pin, Settings, Share2, Trash, TriangleAlert } from "lucide-react";
import React from "react";

interface SummaryStatCardsProps {
  revenueData: any;
  totalAllTimeRevenue: number;
  totalAllTimeProfit: number;
  totalProfitYearFromCustomers: number;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return n.toLocaleString('en-MY');
  return n.toFixed(2);
}

export function SummaryStatCards({
  revenueData,
  totalAllTimeRevenue,
  totalAllTimeProfit,
  totalProfitYearFromCustomers,
}: SummaryStatCardsProps) {
  // Calculate deltas (using mock data for last month - you can replace with actual data)
  const currentYearRevenue = revenueData.currentYear.total;
  const lastMonthRevenue = currentYearRevenue * 0.98; // Mock: 2% growth
  const revenueDelta = ((currentYearRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);

  const lastMonthProfit = totalProfitYearFromCustomers * 0.97; // Mock: 3% growth  
  const profitDelta = ((totalProfitYearFromCustomers - lastMonthProfit) / lastMonthProfit * 100).toFixed(1);

  const lastMonthAllTimeRevenue = totalAllTimeRevenue * 0.995; // Mock: 0.5% growth
  const allTimeRevenueDelta = ((totalAllTimeRevenue - lastMonthAllTimeRevenue) / lastMonthAllTimeRevenue * 100).toFixed(1);

  const lastMonthAllTimeProfit = totalAllTimeProfit * 0.99; // Mock: 1% growth
  const allTimeProfitDelta = ((totalAllTimeProfit - lastMonthAllTimeProfit) / lastMonthAllTimeProfit * 100).toFixed(1);

  const stats = [
    {
      title: `Jumlah Jualan ${revenueData.currentYear.year}`,
      value: currentYearRevenue,
      delta: parseFloat(revenueDelta),
      lastMonth: lastMonthRevenue,
      positive: parseFloat(revenueDelta) > 0,
      bg: 'bg-zinc-950',
      svg: (
        <svg
          className="absolute right-0 top-0 h-full w-2/3 pointer-events-none"
          viewBox="0 0 300 200"
          fill="none"
          style={{ zIndex: 0 }}
        >
          <circle cx="220" cy="100" r="90" fill="#fff" fillOpacity="0.08" />
          <circle cx="260" cy="60" r="60" fill="#fff" fillOpacity="0.10" />
          <circle cx="200" cy="160" r="50" fill="#fff" fillOpacity="0.07" />
          <circle cx="270" cy="150" r="30" fill="#fff" fillOpacity="0.12" />
        </svg>
      ),
    },
    {
      title: `Jumlah Untung ${new Date().getFullYear()}`,
      value: totalProfitYearFromCustomers,
      delta: parseFloat(profitDelta),
      lastMonth: lastMonthProfit,
      positive: parseFloat(profitDelta) > 0,
      bg: 'bg-fuchsia-600',
      svg: (
        <svg
          className="absolute right-0 top-0 w-48 h-48 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <filter id="blur2" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>
          <ellipse cx="170" cy="60" rx="40" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur2)" />
          <rect x="120" y="20" width="60" height="20" rx="8" fill="#fff" fillOpacity="0.10" />
          <polygon points="150,0 200,0 200,50" fill="#fff" fillOpacity="0.07" />
          <circle cx="180" cy="100" r="14" fill="#fff" fillOpacity="0.16" />
        </svg>
      ),
    },
    {
      title: 'Total Revenue',
      value: totalAllTimeRevenue,
      delta: parseFloat(allTimeRevenueDelta),
      lastMonth: lastMonthAllTimeRevenue,
      positive: parseFloat(allTimeRevenueDelta) > 0,
      bg: 'bg-blue-600',
      svg: (
        <svg
          className="absolute right-0 top-0 w-48 h-48 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <filter id="blur3" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="12" />
            </filter>
          </defs>
          <rect x="120" y="0" width="70" height="70" rx="35" fill="#fff" fillOpacity="0.09" filter="url(#blur3)" />
          <ellipse cx="170" cy="80" rx="28" ry="12" fill="#fff" fillOpacity="0.12" />
          <polygon points="200,0 200,60 140,0" fill="#fff" fillOpacity="0.07" />
          <circle cx="150" cy="30" r="10" fill="#fff" fillOpacity="0.15" />
        </svg>
      ),
    },
    {
      title: 'Total Profit',
      value: totalAllTimeProfit,
      delta: parseFloat(allTimeProfitDelta),
      lastMonth: lastMonthAllTimeProfit,
      positive: parseFloat(allTimeProfitDelta) > 0,
      bg: 'bg-teal-600',
      svg: (
        <svg
          className="absolute right-0 top-0 w-48 h-48 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
          style={{ zIndex: 0 }}
        >
          <defs>
            <filter id="blur4" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>
          <polygon points="200,0 200,100 100,0" fill="#fff" fillOpacity="0.09" />
          <ellipse cx="170" cy="40" rx="30" ry="18" fill="#fff" fillOpacity="0.13" filter="url(#blur4)" />
          <rect x="140" y="60" width="40" height="18" rx="8" fill="#fff" fillOpacity="0.10" />
          <circle cx="150" cy="30" r="14" fill="#fff" fillOpacity="0.18" />
          <line x1="120" y1="0" x2="200" y2="80" stroke="#fff" strokeOpacity="0.08" strokeWidth="6" />
        </svg>
      ),
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 animate-slide-up delay-200">
      {stats.map((stat, index) => (
        <Card key={index} className={`relative overflow-hidden ${stat.bg} text-white border-0`}>
          {stat.svg}
          <CardHeader className="border-0 z-10 relative pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-white/90 text-sm font-medium">{stat.title}</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom">
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <TriangleAlert className="h-4 w-4 mr-2" /> Add Alert
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Pin className="h-4 w-4 mr-2" /> Pin to Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Share2 className="h-4 w-4 mr-2" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="h-4 w-4 mr-2" /> Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5 z-10 relative">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-semibold tracking-tight">
                RM{formatNumber(stat.value)}
              </span>
              <Badge className="bg-white/20 text-white font-semibold border-0 hover:bg-white/20">
                {stat.delta > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {Math.abs(stat.delta)}%
              </Badge>
            </div>
            <div className="text-xs text-white/80 mt-2 border-t border-white/20 pt-2.5">
              Vs last month:{' '}
              <span className="font-medium text-white">
                RM{formatNumber(stat.lastMonth)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
