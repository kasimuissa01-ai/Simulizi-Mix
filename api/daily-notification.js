export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }
  try {
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify({
        app_id: process.env.ONESIGNAL_APP_ID,
        included_segments: ['Subscribed Users'],
        headings: { en: 'SimuliziMix' },
        contents: { en: 'Hadithi mpya inakusubiri leo — fungua SimuliziMix!' },
        url: 'https://simulizimix.vercel.app/',
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('[OneSignal] Send failed:', data);
      return res.status(response.status).json(data);
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('[OneSignal] Error:', err);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
