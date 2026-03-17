import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;
  const { data: poll, error } = await supabase.from('polls').select('*').eq('id', id).single();
  if (error || !poll) return res.status(404).json({ error: 'Poll not found' });

  const { data: votes } = await supabase.from('votes').select('option_index').eq('poll_id', id);
  const results = poll.options.map((option, i) => ({
    index: i, option, votes: (votes || []).filter(v => v.option_index === i).length
  }));

  return res.status(200).json({
    id: poll.id, question: poll.question, options: poll.options,
    status: poll.status, articleSlug: poll.article_slug,
    results, totalVotes: (votes || []).length
  });
}
