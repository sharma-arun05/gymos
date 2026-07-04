import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Dumbbell, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gymName, setGymName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          gym_name: gymName,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // In a real flow, you'd check if email confirmation is required.
      // For MVP, we redirect to onboarding or dashboard
      navigate('/onboarding');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-panel w-full max-w-md p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 border border-primary/20">
            <Dumbbell className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create your GymOS</h1>
          <p className="text-text-muted text-sm text-center">Automate follow-ups and scale your gym memberships.</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted ml-1">Gym Name</label>
            <input 
              type="text" 
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              className="input-field" 
              placeholder="Way Ahead Fitness"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted ml-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field" 
              placeholder="owner@gym.com"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-muted ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field" 
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-hover font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};
