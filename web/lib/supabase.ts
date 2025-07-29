import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not configured');
}

// Create a single supabase client for interacting with your database
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

// Helper to get current user
export async function getCurrentUser() {
  if (!supabase) return null;
  
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return user;
}

// Helper to sign in
export async function signIn(email: string, password: string) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

// Helper to sign up
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    }
  });
  
  if (error) throw error;
  return data;
}

// Helper to sign out
export async function signOut() {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Helper for file uploads
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean }
) {
  if (!supabase) throw new Error('Supabase not configured');
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert || false,
    });
  
  if (error) throw error;
  return data;
}

// Helper to get public URL
export function getPublicUrl(bucket: string, path: string): string | null {
  if (!supabase) return null;
  
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Helper for realtime subscriptions
export function subscribeToTable(
  table: string,
  callback: (payload: any) => void,
  filters?: { event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'; filter?: string }
) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return null;
  }
  
  const channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes' as any,
      {
        event: filters?.event || '*',
        schema: 'public',
        table: table,
        filter: filters?.filter,
      },
      callback
    )
    .subscribe();
  
  return channel;
}

// Type exports for better TypeScript support
export type SupabaseUser = Awaited<ReturnType<typeof getCurrentUser>>;
export type SupabaseAuthSession = Awaited<ReturnType<typeof signIn>>;