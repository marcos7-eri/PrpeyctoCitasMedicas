import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dwtwfqqhqlibrewfbavh.supabase.co';

const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHdmcXFocWxpYnJld2ZiYXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDQwNTcsImV4cCI6MjA5MjE4MDA1N30.56kCxn3zoG3xHL97fSXu3PK8rNLzadyKEsPPlUFodhM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);