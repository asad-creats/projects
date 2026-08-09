// Dedicated Supabase client for the Quorum app — its own project, isolated
// from the portfolio's main (Tally) project. Configure in .env.local:
//   REACT_APP_QUORUM_SUPABASE_URL=...
//   REACT_APP_QUORUM_SUPABASE_ANON_KEY=...
import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_QUORUM_SUPABASE_URL;
const anon = process.env.REACT_APP_QUORUM_SUPABASE_ANON_KEY;

export const quorumConfigured = Boolean(url && anon);
export const quorum = quorumConfigured ? createClient(url, anon) : null;

// Turn a username into the synthetic email the backend stores it under.
export const usernameToEmail = (u) => `${String(u).trim().toLowerCase()}@quorum.app`;

// Base URL for Edge Functions (create-employee lives here).
export const functionsBase = url ? `${url.replace(/\/$/, '')}/functions/v1` : '';
