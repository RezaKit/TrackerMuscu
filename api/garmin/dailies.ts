import type { VercelRequest, VercelResponse } from '@vercel/node';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

// Returns Garmin daily summaries (calories burned, steps, heart rate) for the last N days
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { token, secret, days = '7' } = req.query;
  const consumerKey = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.status(503).json({ error: 'Garmin API not configured' });
  }

  if (!token || !secret) {
    return res.status(400).json({ error: 'Missing token or secret' });
  }

  const oauth = new OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base, key) {
      return crypto.createHmac('sha1', key).update(base).digest('base64');
    },
  });

  const userToken = { key: token as string, secret: secret as string };

  const uploadStartTimeInSeconds = Math.floor(Date.now() / 1000) - parseInt(days as string) * 86400;
  const uploadEndTimeInSeconds = Math.floor(Date.now() / 1000);

  const url = `https://healthapi.garmin.com/wellness-api/rest/dailies?uploadStartTimeInSeconds=${uploadStartTimeInSeconds}&uploadEndTimeInSeconds=${uploadEndTimeInSeconds}`;

  const requestData = { url, method: 'GET' as const };
  const headers = oauth.toHeader(oauth.authorize(requestData, userToken));

  try {
    const response = await fetch(url, { headers: { Authorization: (headers as { Authorization: string }).Authorization } });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Garmin API error', status: response.status });
    }
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch Garmin dailies' });
  }
}
