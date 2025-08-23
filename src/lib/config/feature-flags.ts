export type FeatureFlagName = 'NEW_UI';

/**
 * Simple feature flag reader for client/server usage.
 * Backed by environment variables so we can toggle per environment.
 */
export const isFeatureEnabled = (name: FeatureFlagName): boolean => {
  switch (name) {
    case 'NEW_UI':
      return (process.env.NEXT_PUBLIC_NEW_UI || '').toLowerCase() === 'true';
    default:
      return false;
  }
};

export const isNewUIEnabled = (): boolean => isFeatureEnabled('NEW_UI');
