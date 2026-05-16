import { Loader2 } from "lucide-react";
import { Skeleton } from "@/original/components/ui/skeleton";

export function PageLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header skeleton */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex h-14 items-center justify-between px-4">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 container px-4 py-6">
        <div className="space-y-6">
          {/* Title */}
          <Skeleton className="h-10 w-48" />

          {/* Search bar */}
          <Skeleton className="h-10 w-full max-w-md" />

          {/* Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">جاري التحميل...</span>
      </div>
    </div>
  );
}

export function DetailPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex h-14 items-center px-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-32 ms-4" />
        </div>
      </div>

      {/* Content */}
      <div className="container px-4 py-6 space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-48 w-48 rounded-full" />
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm font-medium">جاري التحميل...</span>
      </div>
    </div>
  );
}
