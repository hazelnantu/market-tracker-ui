import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tqkqjotpxlubgrcrhnfp.supabase.co' 
const supabaseAnonKey = 'sb_publishable_TKH9lOEieqWp5O21jESgsg_obBUh6pO' // 刚刚复制的 sb_publishable_...

export const supabase = createClient(supabaseUrl, supabaseAnonKey)