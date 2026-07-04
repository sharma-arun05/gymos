import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { gymService } from '../../services/gymService';

export const GymOnboarding: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!user) {
      setError("User session not found.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const gymData = {
      name: formData.get('name') as string,
      industry: formData.get('industry') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string,
      email: user.email, // Use auth email for the gym
      plan: 'Starter'
    };

    try {
      // 1. Create Gym
      const gym = await gymService.createGym(gymData);
      
      // 2. Link User to Gym
      await gymService.linkUserToGym(user.id, gym.id, user.email || '');
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create gym profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="glass-panel w-full max-w-2xl p-8 md:p-12 z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
            <Dumbbell className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 text-center">Set up your Gym Profile</h1>
          <p className="text-text-muted text-center max-w-md">
            Let's get some basic details about your gym to personalize your Follow-Up AI and templates.
          </p>
        </div>

        <form onSubmit={handleComplete} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted ml-1">Gym Name</label>
              <input name="name" type="text" className="input-field" placeholder="Way Ahead Fitness" required />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted ml-1">Industry / Niche</label>
              <select name="industry" className="input-field bg-surface text-text">
                <option value="Traditional Gym">Traditional Gym</option>
                <option value="CrossFit Box">CrossFit Box</option>
                <option value="Yoga Studio">Yoga Studio</option>
                <option value="MMA / Martial Arts">MMA / Martial Arts</option>
                <option value="Personal Training">Personal Training</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted ml-1">Phone Number</label>
              <input name="phone" type="tel" className="input-field" placeholder="+1 (555) 000-0000" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-muted ml-1">Website (Optional)</label>
              <input name="website" type="url" className="input-field" placeholder="https://..." />
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={loading} className="btn-primary w-full md:w-auto px-8">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Complete Setup <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
