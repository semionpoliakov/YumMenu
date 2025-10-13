'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMenusQuery } from '@/data-access/hooks';
import { cn } from '@/lib/utils';

export default function MenusPage() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useMenusQuery();

  const handleNavigate = (id: string, status: string) => {
    if (status === 'draft') {
      router.push(`/checkout/${id}`);
    } else {
      router.push(`/menus/${id}/options`);
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <Header title="Menus" />

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="space-y-3 py-6 text-center text-sm text-destructive">
            <p>Failed to load menus.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((menu) => (
            <Card
              key={menu.id}
              onClick={() => handleNavigate(menu.id, menu.status)}
              className={cn(
                'cursor-pointer transition hover:shadow-md',
                menu.status === 'draft' && 'border-dashed opacity-75',
              )}
            >
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1 text-left">
                  <p className="font-medium">{menu.name}</p>
                  {menu.status === 'draft' ? (
                    <span className="text-xs uppercase text-muted-foreground">Draft</span>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Open ${menu.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleNavigate(menu.id, menu.status);
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-6 text-center text-sm text-muted-foreground">
            No menus yet. Generate one to see it here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
