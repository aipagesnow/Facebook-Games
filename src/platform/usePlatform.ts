import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { isStudioPlatform, PLATFORM, type StudioPlatform } from './config';

export function usePlatform() {
  const { platform: raw } = useParams();
  const platform: StudioPlatform = isStudioPlatform(raw) ? raw : 'facebook';
  const config = PLATFORM[platform];

  return useMemo(
    () => ({
      platform,
      config,
      base: `/${platform}`,
      isFacebook: platform === 'facebook',
      isAndroid: platform === 'android',
    }),
    [platform, config]
  );
}
