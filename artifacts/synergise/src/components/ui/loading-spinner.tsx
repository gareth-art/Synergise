import { Loader2 } from "lucide-react";

export function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-synergise-background">
      <Loader2 className="h-8 w-8 animate-spin text-synergise-primary mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
