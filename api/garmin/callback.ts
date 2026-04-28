import type { VercelRequest, VercelResponse } from '@vercel/node';
import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { oauth_token, oauth_verifier } = req.query;
  const consumerKey = process.env.GARMIN_CONSUMER_KEY;
  const consumerSecret = process.env.GARMIN_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    return res.redirect(302, '/?garmin_error=not_configured');
  }

  if (!oauth_token || !oauth_verifier) {
    return res.redirect(302, '/?garmin_error=missing_params');
  }

  const oauth = new OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base, key) {
      return crypto.createHmac('sha1', key).update(base).digest('base64');
    },
  });

  const token = { key: oauth_token as string, secret: '' };

  const requestData = {
    url: 'https://connectapi.garmin.com/oauth-service/oauth/access_token',
    method: 'POST' as const,
    data: { oauth_verifier: oauth_verifier as string },
  };

  const headers = oauth.toHeader(oauth.authorize(requestData, token));

  try {
    const response = await fetch(requestData.url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ oauth_verifier: oauth_verifier as string }),
    });

    const text = await response.text();
    const params = new URLSearchParams(text);
    const accessToken = params.get('oauth_token');
    const accessSecret = params.get('oauth_token_secret');

    if (!accessToken || !accessSecret) {
      return res.redirect(302, '/?garmin_error=token_exchange_failed');
    }

    const urlParams = new URLSearchParams({
      garmin_token: accessToken,
      garmin_secret: accessSecret,
    });

    res.redirect(302, `/?${urlParams.toString()}`);
  } catch {
    res.redirect(302, '/?garmin_error=server_error');
  }
}
