// src/supabaseClient.js
import { createClient } from '@supabase/supabase-js'; // Use -js here

const supabaseUrl = 'https://llflheazvckafijndfqq.supabase.co';
const supabaseAnonKey = 'sb_publishable_LI48ZYunseA-pcoGEH6EOQ_GOSXnu71';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);