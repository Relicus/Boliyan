'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboard } from '@/context/DashboardContext';
import { Package, Gavel, CheckCircle, DollarSign, LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Package,
  Gavel,
  CheckCircle,
  DollarSign
};

export function SellerStats() {
  const { metrics, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
         {[1, 2, 3, 4].map((i) => (
           <Card key={i} className="animate-pulse">
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <div className="h-4 w-24 bg-muted rounded"></div>
             </CardHeader>
             <CardContent>
               <div className="h-8 w-12 bg-muted rounded"></div>
             </CardContent>
           </Card>
         ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.icon] || Package;
        return (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.label}
              </CardTitle>
              <Icon className={`h-4 w-4 ${metric.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
              {metric.trend && (
                <p className="text-xs text-muted-foreground">
                  {metric.trend > 0 ? '+' : ''}{metric.trend}% from last month
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
