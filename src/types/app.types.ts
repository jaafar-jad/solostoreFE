export type AppStatus =
  | 'draft'
  | 'building'
  | 'pending_review'
  | 'published'
  | 'rejected'
  | 'unpublished';

export type Orientation = 'portrait' | 'landscape' | 'both';

export type BuildStatus =
  | 'queued'
  | 'building'
  | 'signing'
  | 'uploading'
  | 'completed'
  | 'failed';

export const APP_CATEGORIES = [
  'Business',
  'Education',
  'Entertainment',
  'Finance',
  'Food & Drink',
  'Health & Fitness',
  'Lifestyle',
  'Music',
  'News',
  'Photography',
  'Productivity',
  'Shopping',
  'Social',
  'Sports',
  'Tools',
  'Travel',
  'Weather',
  'Other',
] as const;

export type AppCategory = (typeof APP_CATEGORIES)[number];

export interface App {
  _id: string;
  developer: string;
  name: string;
  packageName: string;
  websiteUrl: string;
  shortDescription: string;
  fullDescription: string;
  category: AppCategory;
  version: string;
  icon: string | null;
  featureGraphic: string | null;
  screenshots: string[];
  splashColor: string;
  accentColor: string;
  orientation: Orientation;
  isFullscreen: boolean;
  enableOfflineMode: boolean;
  enablePushNotifications: boolean;
  domainVerification: string | null;
  apkUrl: string | null;
  apkSize: number | null;
  status: AppStatus;
  rejectionReason: string | null;
  downloadCount: number;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  latestBuildJob: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuildJob {
  _id: string;
  app: string;
  developer: string;
  status: BuildStatus;
  progress: number;
  logs: string[];
  apkUrl: string | null;
  apkSize: number | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DomainVerification {
  _id: string;
  developer: string;
  domain: string;
  token: string;
  method: 'dns_txt' | 'file';
  status: 'pending' | 'verified' | 'failed';
  verifiedAt: string | null;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  app: string;
  reviewer: {
    _id: string;
    username: string;
    avatar: string | null;
  } | null;
  reviewerName: string;   // always present — either entered by user or pulled from profile
  rating: number;         // 0.5 increments
  title: string;
  body: string;
  isVerifiedDownload: boolean;
  helpfulCount: number;
  createdAt: string;
}
