import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import type { Gym } from '../types/database';

interface GymContextType {
  gym: Gym | null;
  gymId: string | null;
  gymName: string | null;
  plan: string;
  role: string;
  isLoading: boolean;
  loading: boolean;
  refetch: () => void;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [gym, setGym] = useState<Gym | null>(null);
  const [plan, setPlan] = useState<string>('Starter');
  const [role, setRole] = useState<string>('Owner');
  const [isLoading, setIsLoading] = useState(true);

  const fetchGym = async () => {
    if (!user) {
      setGym(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Step 1: Get user profile to find gym_id and role
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('gym_id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile?.gym_id) {
      setGym(null);
      setIsLoading(false);
      return;
    }

    if (profile.role) setRole(profile.role);

    // Step 2: Fetch the gym record
    const { data: gymData, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', profile.gym_id)
      .single();

    if (gymError) {
      setGym(null);
    } else {
      setGym(gymData);
    }

    // Step 3: Fetch the subscription plan
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('gym_id', profile.gym_id)
      .single();

    if (subData?.plan && subData.status === 'active') {
      setPlan(subData.plan);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchGym();
  }, [user]);

  return (
    <GymContext.Provider value={{ gym, gymId: gym?.id || null, gymName: gym?.name || null, plan, role, isLoading, loading: isLoading, refetch: fetchGym }}>
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (context === undefined) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
