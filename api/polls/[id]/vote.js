import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const { optionIndex, fingerprint } = req.body;
  if (typeof optionIndex !== 'number') return res.status(400).json({ error: 'optionIndex required' });

  const { data: poll } = await supabase.from('polls').select('id,options,status').eq('id', id).single();
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.status !== 'active') return res.status(403).json({ error: 'Poll not active' });
  if (optionIndex < 0 || optionIndex >= poll.options.length) return res.status(400).json({ error: 'Invalid option' });

  if (fingerprint) {
    const { data: existing } = await supabase.from('votes').select('id').eq('poll_id', id).eq('fingerprint', fingerprint).single();
    if (existing) return res.status(409).json({ error: 'Already voted' });
  }

  const { error } = await supabase.from('votes').insert({ poll_id: id, option_index: optionIndex, fingerprint });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ success: true });
}
