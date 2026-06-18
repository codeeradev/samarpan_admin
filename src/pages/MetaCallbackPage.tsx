import { completeMetaCallbackApi } from "@/apiCalls/metaAnalytics";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function MetaCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");

    if (!code || !state) {
      setError("Meta did not return the required login details.");
      return;
    }

    completeMetaCallbackApi(code, state)
      .then(() => {
        toast.success("Meta login completed");
        navigate({ to: "/meta-analytics" });
      })
      .catch((callbackError) => {
        const message = getApiErrorMessage(
          callbackError,
          "Unable to complete Meta login.",
        );
        setError(message);
        toast.error(message);
      });
  }, [navigate]);

  return (
    <div className="max-w-xl mx-auto pt-10">
      <Card className="shadow-card border border-border rounded-2xl">
        <CardContent className="p-6">
          {error ? (
            <div className="flex items-start gap-3">
              <XCircle className="text-destructive mt-0.5" size={22} />
              <div>
                <h1 className="text-lg font-semibold text-foreground font-display">
                  Meta login failed
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-primary mt-0.5" size={22} />
              <div className="flex-1 space-y-3">
                <h1 className="text-lg font-semibold text-foreground font-display">
                  Completing Meta login
                </h1>
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
