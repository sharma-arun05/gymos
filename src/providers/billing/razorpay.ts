import { supabase } from '../../lib/supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  razorpayPlanId: string;
}

export const PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 1999,
    features: ['Lead CRM', 'Dashboard', 'Templates', 'Email follow-ups'],
    razorpayPlanId: 'plan_starter_monthly' // Mock plan ID
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: 4999,
    features: ['WhatsApp automation', 'AI follow-up', 'Analytics', 'Widget'],
    razorpayPlanId: 'plan_growth_monthly' // Mock plan ID
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9999,
    features: ['AI assistant', 'Custom automations', 'Staff accounts', 'Advanced analytics'],
    razorpayPlanId: 'plan_pro_monthly' // Mock plan ID
  }
};

export const razorpayProvider = {
  async createSubscription(gymId: string, planId: string): Promise<{ subscriptionId: string }> {
    const plan = PLANS[planId];
    if (!plan) throw new Error("Invalid plan selected");

    const { data, error } = await supabase.functions.invoke('create-subscription', {
      body: { gymId, planId, razorpayPlanId: plan.razorpayPlanId }
    });

    if (error) {
      console.error("Failed to create subscription:", error);
      throw error;
    }

    return data;
  },

  async verifyPayment(
    gymId: string, 
    razorpayPaymentId: string, 
    razorpaySubscriptionId: string, 
    razorpaySignature: string
  ): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: { 
        gymId, 
        razorpayPaymentId, 
        razorpaySubscriptionId, 
        razorpaySignature 
      }
    });

    if (error) {
      console.error("Failed to verify payment:", error);
      throw error;
    }

    return data.success;
  }
};
