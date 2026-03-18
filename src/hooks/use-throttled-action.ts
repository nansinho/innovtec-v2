"use client";

import { useRef, useCallback } from "react";

/**
 * Wraps an async action so that concurrent invocations are ignored.
 * While the action is running, any additional calls are silently dropped.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useThrottledAction<T extends (...args: any[]) => Promise<any>>(
  action: T
): T {
  const pendingRef = useRef(false);

  const wrapped = useCallback(
    async (...args: Parameters<T>) => {
      if (pendingRef.current) return;
      pendingRef.current = true;
      try {
        return await action(...args);
      } finally {
        pendingRef.current = false;
      }
    },
    [action]
  ) as unknown as T;

  return wrapped;
}
