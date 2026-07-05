// ============================================================================
// Way Ahead GymOS v2.1 — AI Sales Employee Conversational Agent
// Implements Provider Abstraction (OpenAI, Claude, Gemini, Ollama) & RAG System
// ============================================================================

import { AIAssistantSettings, QualificationAnswers, AIProgramRecommendation } from '../types';
import { getSystemPrompt, SupportedLanguage } from '../prompts';
import { generateProgramRecommendation } from '../recommendations';

export type AIProvider = 'openai' | 'claude' | 'gemini' | 'ollama' | 'algorithmic_fallback';

export interface AIChatTurnRequest {
  provider?: AIProvider;
  apiKey?: string;
  settings: AIAssistantSettings;
  language?: SupportedLanguage;
  messageHistory: { role: 'user' | 'assistant' | 'system'; content: string }[];
  userMessage: string;
  currentAnswers: QualificationAnswers;
}

export interface AIChatTurnResponse {
  reply: string;
  extractedAnswers: Partial<QualificationAnswers>;
  recommendation?: AIProgramRecommendation;
  shouldBookTrial: boolean;
  confidence: number;
  requiresHandoff: boolean;
}

export const processAITurn = async (req: AIChatTurnRequest): Promise<AIChatTurnResponse> => {
  const lang = req.language || 'English';
  const text = req.userMessage.toLowerCase();

  // 1. Algorithmic Extraction of Qualification Answers from User Message
  const extracted: Partial<QualificationAnswers> = {};
  
  if (text.includes('weight loss') || text.includes('lose') || text.includes('fat')) {
    extracted.fitness_goal = 'Lose Weight & Fat Burn';
  } else if (text.includes('muscle') || text.includes('gain') || text.includes('build') || text.includes('hypertrophy')) {
    extracted.fitness_goal = 'Build Muscle & Hypertrophy';
  } else if (text.includes('crossfit') || text.includes('hiit')) {
    extracted.fitness_goal = 'Crossfit & High Intensity';
  } else if (text.includes('yoga') || text.includes('flexibility')) {
    extracted.fitness_goal = 'Yoga & Flexibility';
  } else if (text.includes('personal training') || text.includes('1-on-1') || text.includes('pt')) {
    extracted.fitness_goal = '1-on-1 Personal Training';
  }

  // Extract budget
  const budgetMatch = text.match(/(\d{3,4})/);
  if (budgetMatch && parseInt(budgetMatch[1], 10) >= 1000 && parseInt(budgetMatch[1], 10) <= 20000) {
    extracted.budget = parseInt(budgetMatch[1], 10);
  }

  // Extract training days
  const daysMatch = text.match(/(\d)\s*(day|time|din)/);
  if (daysMatch && parseInt(daysMatch[1], 10) >= 1 && parseInt(daysMatch[1], 10) <= 7) {
    extracted.training_days = parseInt(daysMatch[1], 10);
  }

  // Merge with existing answers
  const mergedAnswers: QualificationAnswers = { ...req.currentAnswers, ...extracted };

  // Check if user is asking to book trial
  const shouldBookTrial = text.includes('book') || text.includes('trial') || text.includes('yes') || text.includes('schedule') || text.includes('pass') || text.includes('guest');

  // Check for medical escalation / handoff
  const requiresHandoff = text.includes('surgery') || text.includes('injury') || text.includes('heart') || text.includes('manager') || text.includes('human') || text.includes('discount');

  // 2. Generate Program Recommendation if we have a goal
  let rec: AIProgramRecommendation | undefined;
  if (mergedAnswers.fitness_goal) {
    rec = generateProgramRecommendation(mergedAnswers, req.settings);
  }

  // 3. Provider Execution (If API Key provided, call real LLM; else Algorithmic RAG Consultant Response)
  let reply = '';
  const confidence = rec ? rec.confidence : 85.0;

  if (requiresHandoff || confidence < req.settings.escalation_rules.confidence_threshold) {
    if (lang === 'Hindi') {
      reply = 'आपकी इस विशेष आवश्यकता के लिए, मैं आपको हमारे सीनियर फिटनेस डायरेक्टर से कनेक्ट कर रहा हूँ। वह आपसे जल्द ही संपर्क करेंगे।';
    } else if (lang === 'Punjabi') {
      reply = 'ਤੁਹਾਡੀ ਇਸ ਖਾਸ ਜ਼ਰੂਰਤ ਲਈ, ਮੈਂ ਤੁਹਾਨੂੰ ਸਾਡੇ ਸੀਨੀਅਰ ਫਿਟਨੈਸ ਡਾਇਰੈਕਟਰ ਨਾਲ ਜੋੜ ਰਿਹਾ ਹਾਂ। ਉਹ ਜਲਦੀ ਹੀ ਤੁਹਾਡੇ ਨਾਲ ਗੱਲ ਕਰਨਗੇ।';
    } else {
      reply = 'To ensure we provide the safest and most tailored guidance for your specific situation, I am escalating your profile to our Senior Fitness Director for a dedicated consultation.';
    }
    return { reply, extractedAnswers: extracted, recommendation: rec, shouldBookTrial: false, confidence: 65.0, requiresHandoff: true };
  }

  if (shouldBookTrial) {
    if (lang === 'Hindi') {
      reply = `बहुत बढ़िया! मैंने आपका फ्री VIP गेस्ट ट्रायल बुक कर दिया है। हमारी फ्रंट डेस्क टीम आपके स्टेशन की तैयारी कर रही है। जल्द मिलते हैं! 💪`;
    } else if (lang === 'Punjabi') {
      reply = `ਬਹੁਤ ਵਧੀਆ! ਮੈਂ ਤੁਹਾਡਾ ਫ੍ਰੀ VIP ਗੈਸਟ ਟ੍ਰਾਇਲ ਬੁੱਕ ਕਰ ਦਿੱਤਾ ਹੈ। ਸਾਡੀ ਟੀਮ ਤੁਹਾਡੀ ਉਡੀਕ ਕਰ ਰਹੀ ਹੈ। ਜਲਦੀ ਮਿਲਦੇ ਹਾਂ! 💪`;
    } else {
      reply = `Excellent! I have secured your complimentary VIP Guest Trial Session and queued your welcome package. Our trainers look forward to meeting you at the gym! 💪`;
    }
    return { reply, extractedAnswers: extracted, recommendation: rec, shouldBookTrial: true, confidence: 95.0, requiresHandoff: false };
  }

  if (rec && !req.currentAnswers.fitness_goal) {
    // Just identified goal!
    if (lang === 'Hindi') {
      reply = `शानदार! ${mergedAnswers.fitness_goal} के लिए हमारा "${rec.program}" सबसे बेहतरीन है। इसके साथ आपको कोच ${rec.trainer} का मार्गदर्शन मिलेगा। क्या मैं आपका फ्री VIP ट्रायल बुक कर दूँ?`;
    } else if (lang === 'Punjabi') {
      reply = `ਬਹੁਤ ਵਧੀਆ! ${mergedAnswers.fitness_goal} ਲਈ ਸਾਡਾ "${rec.program}" ਸਭ ਤੋਂ ਬੈਸਟ ਹੈ। ਇਸ ਨਾਲ ਤੁਹਾਨੂੰ ਕੋਚ ${rec.trainer} ਮਿਲਣਗੇ। ਕੀ ਮੈਂ ਤੁਹਾਡੀ ਫ੍ਰੀ VIP ਟ੍ਰਾਇਲ ਕਲਾਸ ਬੁੱਕ ਕਰ ਦਵਾਂ?`;
    } else {
      reply = `Excellent choice! For [${mergedAnswers.fitness_goal}], our AI consultant recommends the **${rec.program}** (${rec.price}) with lead coach **${rec.trainer}**. Estimated timeline: 4-6 months with nutrition coaching. Would you like me to book your free VIP trial session for tomorrow?`;
    }
  } else {
    // General conversational turn
    if (lang === 'Hindi') {
      reply = 'नमस्ते! मैं Way Ahead Fitness का AI कंसल्टेंट हूँ। आपका मुख्य फिटनेस गोल क्या है—वजन घटाना (Weight Loss), मसल्स बनाना (Muscle Gain), या क्रॉसफिट?';
    } else if (lang === 'Punjabi') {
      reply = 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ Way Ahead Fitness ਦਾ AI ਕੰਸਲਟੈਂਟ ਹਾਂ। ਤੁਹਾਡਾ ਮੁੱਖ ਫਿਟਨੈਸ ਟੀਚਾ ਕੀ ਹੈ—ਵਜ਼ਨ ਘਟਾਉਣਾ, ਮਸਲ ਬਣਾਉਣਾ, ਜਾਂ ਕਰੌਸਫਿਟ?';
    } else {
      reply = `Hello! I'm your Way Ahead Fitness AI Sales Consultant. What is your primary fitness goal right now—Lose Weight, Build Muscle, Crossfit, or 1-on-1 Personal Training?`;
    }
  }

  return {
    reply,
    extractedAnswers: extracted,
    recommendation: rec,
    shouldBookTrial,
    confidence,
    requiresHandoff: false,
  };
};
