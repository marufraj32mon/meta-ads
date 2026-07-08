export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const r = await fetch('https://sells.alzeena.com.bd/public/api/products', {
      headers: { 'Accept': 'application/json' }
    });
    const text = await r.text();
    res.setHeader('Content-Type', r.headers.get('content-type') || 'application/json; charset=utf-8');
    return res.status(r.status).send(text);
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Products API fetch failed' });
  }
}
