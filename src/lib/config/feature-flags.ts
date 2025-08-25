export type FeatureFlagName = 'NEW_UI';

/**
 * Simple feature flag reader for client/server usage.
 * Backed by environment variables so we can toggle per environment.
 */
export const isFeatureEnabled = (name: FeatureFlagName): boolean => {
  switch (name) {
    case 'NEW_UI': {
      // Allow runtime override via localStorage for preview/review without env flips
      if (typeof window !== 'undefined') {
        try {
          const stored = window.localStorage.getItem('l4d_ui_preview');
          if (stored === 'true') return true;
          if (stored === 'false') return false;
        } catch (_) {
          // ignore storage access errors
        }
      }
      return (process.env.NEXT_PUBLIC_NEW_UI || '').toLowerCase() === 'true';
    }
    default:
      return false;
  }
};

export const isNewUIEnabled = (): boolean => isFeatureEnabled('NEW_UI');
