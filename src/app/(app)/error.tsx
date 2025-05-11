// Make sure this is a Client Component
"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <h2 className="text-2xl font-semibold text-destructive mb-4">
        Something went wrong!
      </h2>
      <p className="text-muted-foreground mb-6">
        {error.message || "An unexpected error occurred."}
      </p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        variant="destructive"
      >
        Try again
      </Button>
    </div>
  );
}
