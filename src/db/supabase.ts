import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://muwplluumpvwmwhrtepq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_W9xIr_SrlghgPWjw8C5QGA_qSwfux0l';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
