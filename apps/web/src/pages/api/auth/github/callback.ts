import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code, state } = req.query;
  res.status(200).json({ status: 'callback-received', code, state });
}

