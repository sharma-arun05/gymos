// ============================================================================
// Way Ahead GymOS v2.1 — Algorithmic Lead Scoring Engine
// Calculates exact sales readiness score (0-100) and assigns pipeline tier.
// ============================================================================

import { QualificationAnswers } from '../types';

export interface LeadScoreResult {
  score: number;
  tier: 'Cold' | 'Warm' | 'Hot';
  factors: { label: string; points: number; max: number }[];
}

export const calculateAlgorithmicScore = (
  answers: QualificationAnswers,
  trialBooked: boolean = false
): LeadScoreResult => {
  let totalScore = 0;
  const factors: { label: string; points: number; max: number }[] = [];

  // 1. Budget Factor (Max 25 pts)
  let budgetPts = 10;
  if (answers.budget && answers.budget >= 4500) budgetPts = 25;
  else if (answers.budget && answers.budget >= 2500) budgetPts = 18;
  totalScore += budgetPts;
  factors.push({ label: 'Declared Monthly Budget', points: budgetPts, max: 25 });

  // 2. Goal Urgency Factor (Max 20 pts)
  let goalPts = 0;
  if (answers.fitness_goal && answers.fitness_goal.trim() !== '') {
    goalPts = 20;
  }
  totalScore += goalPts;
  factors.push({ label: 'Fitness Goal Clarity & Urgency', points: goalPts, max: 20 });

  // 3. Age Factor (Max 10 pts)
  let agePts = 5;
  if (answers.age && answers.age >= 18 && answers.age <= 50) {
    agePts = 10;
  }
  totalScore += agePts;
  factors.push({ label: 'Target Demographic Alignment (Age)', points: agePts, max: 10 });

  // 4. Training Frequency Factor (Max 20 pts)
  let daysPts = 10;
  if (answers.training_days && answers.training_days >= 4) {
    daysPts = 20;
  } else if (answers.training_days && answers.training_days === 3) {
    daysPts = 15;
  }
  totalScore += daysPts;
  factors.push({ label: 'Committed Training Frequency', points: daysPts, max: 20 });

  // 5. Trial Booking Factor (Max 25 pts)
  const trialPts = trialBooked ? 25 : 0;
  totalScore += trialPts;
  factors.push({ label: 'VIP Trial Session Scheduled', points: trialPts, max: 25 });

  // Determine Tier
  let tier: 'Cold' | 'Warm' | 'Hot' = 'Cold';
  if (totalScore >= 70) tier = 'Hot';
  else if (totalScore >= 40) tier = 'Warm';

  return {
    score: Math.min(100, Math.max(0, totalScore)),
    tier,
    factors,
  };
};
