import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Setup Supabase Client (Will fallback gracefully if ENV variables are not provided)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key';

let supabase: SupabaseClient | null = null;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
} catch (error) {
  console.warn('Supabase client failed to initialize:', error);
}

export class SaveService {
  public static async saveState(region: string, playerX: number, playerY: number): Promise<void> {
    console.log(`[SaveService] Attempting to save state... Region: ${region}, X: ${playerX}, Y: ${playerY}`);

    if (!supabase || supabaseUrl.includes('mock.supabase')) {
      // Mock operation since we don't have valid credentials
      return new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
      const { error } = await supabase
        .from('player_states')
        .upsert({
          id: 'user_1', // Hardcoded for demo/local usage
          region,
          grid_x: playerX,
          grid_y: playerY,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('[SaveService] Error saving state:', error);
      } else {
        console.log('[SaveService] Save successful!');
      }
    } catch (err) {
      console.error('[SaveService] Network/Unknown error:', err);
    }
  }
}
