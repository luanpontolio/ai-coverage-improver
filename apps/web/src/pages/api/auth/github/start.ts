import type { NextApiRequest, NextApiResponse } from 'next';

// This file is no longer used - auth handled client-side with direct backend API calls
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(404).json({ error: 'Use direct backend API calls' });
}

