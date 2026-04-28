import type { VercelRequest, VercelResponse } from '@vercel/node';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const consumerKey = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.status(503).json({ error: 'Garmin API not configured. Waiting for developer approval.' });
  }

  const oauth = new OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base, key) {
      return crypto.createHmac('sha1', key).update(base).digest('base64');
    },
  });

  const requestData = {
    url: 'https://connectapi.garmin.com/oauth-service/oauth/request_token',
    method: 'POST' as const,
  };

  const headers = oauth.toHeader(oauth.authorize(requestData));

  try {
    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const text = await response.text();
    const params = new URLSearchParams(text);
    const oauthToken = params.get('oauth_token');

    if (!oauthToken) {
      return res.status(400).json({ error: 'Failed to get request token from Garmin' });
    }

    res.json({
      oauth_token: oauthToken,
      authorize_url: `https://connect.garmin.com/oauthConfirm?oauth_token=${oauthToken}`,
    });
  } catch (err) {
    res.status(500).json({ error: 'Garmin request token failed' });
  }
}
