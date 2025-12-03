import { supabase } from '@shared/services/supabase';

export async function getUserRole(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.role ?? null;
}

export default getUserRole;
