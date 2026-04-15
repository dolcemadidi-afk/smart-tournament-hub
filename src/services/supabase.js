import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ofdliadevkfhbhsqwmgb.supabase.co";
const supabaseAnonKey = "sb_publishable_gqt_wjt5KqKS2gk7n52b1w_QtZLBmIP";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);