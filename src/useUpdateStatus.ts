import { useEffect, useState } from "react";
import type { UpdateStatus } from "./core/types";
import type { Platform } from "./platform";

export function useUpdateStatus(platform: Platform): UpdateStatus | null {
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  useEffect(() => {
    let cancelled = false;
    void platform.getUpdateStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    const off = platform.onUpdate((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
      off();
    };
  }, [platform]);
  return status;
}
