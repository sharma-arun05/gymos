import { supabase } from '../lib/supabase';

/**
 * Resolves the gym name for a given gym_id.
 */
export async function getGymName(gymId: string): Promise<string> {
  const { data, error } = await supabase
    .from('gyms')
    .select('name')
    .eq('id', gymId)
    .single();

  if (error || !data) return 'Our Gym';
  return data.name;
}

/**
 * Replaces template variables with real lead + gym data.
 */
export function replaceTemplateVariables(
  content: string,
  variables: {
    name: string;
    phone?: string | null;
    email?: string | null;
    goal?: string | null;
    gym_name: string;
  }
): string {
  let result = content;
  result = result.replace(/\{\{name\}\}/g, variables.name);
  result = result.replace(/\{\{phone\}\}/g, variables.phone || '');
  result = result.replace(/\{\{email\}\}/g, variables.email || '');
  result = result.replace(/\{\{goal\}\}/g, variables.goal || 'your fitness goals');
  result = result.replace(/\{\{gym_name\}\}/g, variables.gym_name);
  return result;
}
