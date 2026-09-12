import { useCallback, useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate, type Blocker } from "react-router";

export interface UseFormGuardReturn {
  /** True when a navigation attempt is blocked and waiting for user confirmation */
  isBlocked: boolean;
  /** Proceed with navigation and discard unsaved changes */
  confirmLeave: () => void;
  /** Stay on current page, cancel navigation, and keep editing */
  cancelLeave: () => void;
  /** Guard any manual action (e.g., Back button, Close modal) */
  guardedAction: (action: () => void) => void;
  /** Guarded navigate helper that prompts if form is dirty */
  guardedNavigate: (to: string | number, options?: { replace?: boolean }) => void;
  /** Direct access to the router blocker */
  blocker: Blocker | null;
}

/**
 * Shopify-grade Form Safety Hook:
 * - Detects unsaved changes across form fields.
 * - Intercepts browser tab close / reload (window.onbeforeunload).
 * - Intercepts React Router internal navigation via useBlocker.
 * - Guards custom back buttons and programmatic actions.
 */
export function useFormGuard(isDirty: boolean): UseFormGuardReturn {
  const navigate = useNavigate();
  const [hasPendingAction, setHasPendingAction] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // 1. Intercept Browser Tab Close / Refresh Events
  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Standard browser confirmation prompt trigger
      event.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // 2. Intercept Internal Router Navigation via useBlocker
  const blockerFunction = useCallback(
    ({ currentLocation, nextLocation }: { currentLocation: any; nextLocation: any }) => {
      if (!isDirty) return false;
      // Do not block query parameter changes or hash anchors on the same path
      return currentLocation.pathname !== nextLocation.pathname;
    },
    [isDirty]
  );

  let blocker: Blocker | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    blocker = useBlocker(blockerFunction);
  } catch {
    // Fallback if rendered outside a data router context
    blocker = null;
  }

  // 3. Guard custom programmatic actions (e.g. Back button, modal close)
  const guardedAction = useCallback(
    (action: () => void) => {
      if (!isDirty) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setHasPendingAction(true);
    },
    [isDirty]
  );

  // 4. Guarded navigation helper
  const guardedNavigate = useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      guardedAction(() => {
        if (typeof to === "number") {
          navigate(to);
        } else {
          navigate(to, options);
        }
      });
    },
    [guardedAction, navigate]
  );

  // 5. Confirm leaving / discarding changes
  const confirmLeave = useCallback(() => {
    if (blocker && blocker.state === "blocked") {
      blocker.proceed();
    }
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      setHasPendingAction(false);
      action();
    }
  }, [blocker]);

  // 6. Cancel leaving / keep editing
  const cancelLeave = useCallback(() => {
    if (blocker && blocker.state === "blocked") {
      blocker.reset();
    }
    pendingActionRef.current = null;
    setHasPendingAction(false);
  }, [blocker]);

  const isBlocked = (blocker?.state === "blocked") || hasPendingAction;

  return {
    isBlocked,
    confirmLeave,
    cancelLeave,
    guardedAction,
    guardedNavigate,
    blocker,
  };
}

