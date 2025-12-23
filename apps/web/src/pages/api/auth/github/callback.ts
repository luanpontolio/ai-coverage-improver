import type { NextApiRequest, NextApiResponse } from 'next';

// This file is no longer used - callback handled client-side
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(404).json({ error: 'Use direct backend API calls' });
}

