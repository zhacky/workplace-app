import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <Skeleton className="h-10 w-1/3" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-2/3" />
      </div>
    </div>
  );
}
