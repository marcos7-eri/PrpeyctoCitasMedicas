import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dwtwfqqhqlibrewfbavh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dHdmcXFocWxpYnJld2ZiYXZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDQwNTcsImV4cCI6MjA5MjE4MDA1N30.56kCxn3zoG3xHL97fSXu3PK8rNLzadyKEsPPlUFodhM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});