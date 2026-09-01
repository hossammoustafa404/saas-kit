'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';

import { DASHBOARD_PLACEHOLDER_STATS } from '../constants';

export function DashboardHomeView() {
  const { data: session } = useSession();
  const name = session?.user?.name;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{name ? `, ${name}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your workspace overview will appear here.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DASHBOARD_PLACEHOLDER_STATS.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{stat.title}</CardTitle>
              <Badge variant="secondary">Coming soon</Badge>
            </CardHeader>
            <CardContent>
              <CardDescription>{stat.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
