import { useEffect, useState, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { updateService } from '../services/update.service';
import type { UpdateCheckResult } from '@vitacare/shared-types';

interface UseUpdateReturn {
  result: UpdateCheckResult | null;
  isChecking: boolean;
  checkNow: () => Promise<void>;
  dismiss: () => void;
}

/**
 * Checks for a native binary update when:
 *   - The component mounts
 *   - The app returns to foreground (AppState active)
 *
 * Also runs the silent OTA check on mount.
 */
export function useUpdate(): UseUpdateReturn {
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const checkNow = useCallback(async () => {
    setIsChecking(true);
    try {
      // Run both checks in parallel
      const [nativeResult] = await Promise.all([
        updateService.checkForNativeUpdate(),
        updateService.runOTAFlow(), // OTA is self-contained; result shown via Alert
      ]);
      setResult(nativeResult);
      setDismissed(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Check on mount
  useEffect(() => {
    checkNow();
  }, [checkNow]);

  // Check whenever the app comes back to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        checkNow();
      }
    });
    return () => subscription.remove();
  }, [checkNow]);

  const dismiss = useCallback(() => setDismissed(true), []);

  return {
    result: dismissed ? null : result,
    isChecking,
    checkNow,
    dismiss,
  };
}
