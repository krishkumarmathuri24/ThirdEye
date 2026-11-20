import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://alpszsjxlriykgqzrsis.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscHN6c2p4bHJpeWtncXpyc2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUxODk0NDQsImV4cCI6MjExMDc2NTQ0NH0.iOPqzRWDaXfV4Nrr9ECshCtUm-cfEtg41ooxxcPuM4Q';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
