import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    })
  : null;

// Client-side Stripe instance
export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
};

// Pricing plans
export const PRICING_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '3 resume analyses per month',
      'Basic AI feedback',
      'PDF/DOCX upload',
      'Email notifications'
    ],
    limits: {
      monthlyAnalyses: 3
    }
  },
  premium: {
    name: 'Premium',
    price: 9.99,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
    features: [
      'Unlimited resume analyses',
      'Advanced AI feedback',
      'Priority processing',
      'Detailed career insights',
      'Email notifications',
      'Analytics dashboard access',
      'Priority support'
    ],
    limits: {
      monthlyAnalyses: -1 // -1 means unlimited
    }
  }
};

// Subscription status
export type SubscriptionStatus = 'free' | 'premium' | 'cancelled';

export interface UserSubscription {
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Check if user has premium access
export function hasPremiumAccess(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === 'premium';
}

// Check if user can perform analysis (considering limits)
export function canPerformAnalysis(
  subscription: UserSubscription | null,
  monthlyUsage: number
): boolean {
  if (!subscription) return monthlyUsage < PRICING_PLANS.free.limits.monthlyAnalyses;
  
  if (subscription.status === 'premium') return true;
  
  return monthlyUsage < PRICING_PLANS.free.limits.monthlyAnalyses;
}
