/** Facebook Instant Games upload / discovery fields the studio tracks. */
export interface DiscoveryAssets {
  appIcon1024?: string;
  coverImage1600x300?: string;
  squareImage?: string;
  bannerImage?: string;
  videoTrailer?: string;
  screenshots?: string[];
}

export interface MonetizationPlan {
  rewardedAds: boolean;
  interstitialAds: boolean;
  iap: boolean;
  notes?: string;
}

export interface SocialFeatures {
  leaderboards: boolean;
  challenges: boolean;
  contextUpdates: boolean;
  shareResults: boolean;
  invites: boolean;
}

export interface LiveOpsPlan {
  first90Days: string[];
  contentCadence?: string;
  analyticsEvents?: string[];
}

export interface InstantGamesChecklist {
  sub3sLoadTarget: boolean;
  zeroPermissions: boolean;
  teachableLoopUnder30s: boolean;
  initialBundleUnder5mb: boolean;
  fbInstantLifecycle: boolean;
  categorySelected: boolean;
  discoveryAssetsReady: boolean;
}
