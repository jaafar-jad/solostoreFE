export type QueuePriority = 'normal' | 'high' | 'highest';

export interface PlanFeatures {
  maxApps: number;
  maxApkSizeMB: number;
  queuePriority: QueuePriority;
  isFeaturedEligible: boolean;
  hasAnalytics: boolean;
  removeSoloBadge: boolean;
  customPackageName: boolean;
}

export interface Plan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  stripePriceId: string | null;
  features: PlanFeatures;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  developer: string;
  plan: Plan;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  createdAt: string;
  updatedAt: string;
}
