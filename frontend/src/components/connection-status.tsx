"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        await api.health();
        if (mounted) setConnected(true);
      } catch {
        if (mounted) setConnected(false);
      }
    }

    check();
    const interval = setInterval(check, 10_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex cursor-default"
        render={
          <Badge
            variant={connected ? "default" : connected === false ? "destructive" : "secondary"}
            className="gap-1.5 cursor-default"
          />
        }
      >
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? "bg-green-400 animate-pulse" : connected === false ? "bg-red-400" : "bg-muted-foreground"
          }`}
        />
        {connected ? "API Connected" : connected === false ? "API Offline" : "Checking..."}
      </TooltipTrigger>
      <TooltipContent>
        {connected
          ? "Python API is running on 127.0.0.1:8000"
          : "Run: python3 -m api.run"}
      </TooltipContent>
    </Tooltip>
  );
}
