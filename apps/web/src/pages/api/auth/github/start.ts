import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  // Placeholder: server would proxy to API start endpoint
  res.status(200).json({ redirectUrl: 'https://github.com/login/oauth/authorize' });
}

