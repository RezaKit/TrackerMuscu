import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(302, '/?strava_error=access_denied');
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      return res.redirect(302, '/?strava_error=token_failed');
    }

    const data = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      athlete: { id: number; firstname: string; lastname: string };
    };

    const params = new URLSearchParams({
      strava_token: data.access_token,
      strava_refresh: data.refresh_token,
      strava_expires: String(data.expires_at),
      strava_athlete_id: String(data.athlete.id),
      strava_name: `${data.athlete.firstname} ${data.athlete.lastname}`,
    });

    res.redirect(302, `/?${params.toString()}`);
  } catch {
    res.redirect(302, '/?strava_error=server_error');
  }
}
