// ============================================================================
// Way Ahead GymOS v2.1 — AI Program Recommendation Engine
// Matches visitor goals, budgets, and schedules to ideal memberships & coaches.
// ============================================================================

import { AIProgramRecommendation, AIAssistantSettings, QualificationAnswers } from '../types';

export const generateProgramRecommendation = (
  answers: QualificationAnswers,
  settings: AIAssistantSettings
): AIProgramRecommendation => {
  const goal = (answers.fitness_goal || '').toLowerCase();
  const budget = answers.budget || 3000;
  const days = answers.training_days || 3;

  // Find best membership plan
  let selectedPlan = settings.memberships.find((m) => m.popular) || settings.memberships[1] || settings.memberships[0];
  if (budget >= 6500 || goal.includes('personal') || goal.includes('1-on-1')) {
    const elite = settings.memberships.find((m) => m.name.toLowerCase().includes('elite') || m.price >= 6000);
    if (elite) selectedPlan = elite;
  } else if (budget <= 2200) {
    const starter = settings.memberships.find((m) => m.price <= 2500);
    if (starter) selectedPlan = starter;
  } else if (days >= 5) {
    const prem = settings.memberships.find((m) => m.name.toLowerCase().includes('premium') || m.price >= 4000);
    if (prem) selectedPlan = prem;
  }

  // Find best trainer match
  let matchedTrainer = 'Recommended Senior Specialist';
  if (settings.trainers && settings.trainers.length > 0) {
    const goalMatch = settings.trainers.find((t) => t.specialization.toLowerCase().includes(goal.split(' ')[0]));
    matchedTrainer = goalMatch ? goalMatch.name + ' (' + goalMatch.specialization + ')' : settings.trainers[0].name + ' (' + settings.trainers[0].specialization + ')';
  }

  // Calculate confidence score (75% to 98%)
  let confidence = 85;
  if (answers.fitness_goal && answers.budget && answers.training_days) {
    confidence = 94.5;
  } else if (answers.fitness_goal && answers.budget) {
    confidence = 89.0;
  }

  // Generate clear reasoning
  const reasoning = `Based on your goal of [${answers.fitness_goal || 'General Fitness'}] with a ${days}-day weekly schedule and budget around ₹${budget}/mo, our AI consultant matched you with the ${selectedPlan.name} and coach ${matchedTrainer}.`;

  return {
    program: selectedPlan ? selectedPlan.name : 'Growth Pro Plan',
    confidence,
    duration: '6 Months Transformation',
    trainer: matchedTrainer,
    nutrition: selectedPlan ? selectedPlan.price >= 4000 : true,
    price: selectedPlan ? `₹${selectedPlan.price}/month` : '₹2999/month',
    reasoning,
  };
};
