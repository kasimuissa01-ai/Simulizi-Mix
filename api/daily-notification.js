export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Determine time of day for customized message (EAT UTC+3 or UTC)
  const now = new Date();
  const utcHour = now.getUTCHour();
  // Convert UTC to East Africa Time (UTC+3)
  const eatHour = (utcHour + 3) % 24;

  let heading = 'SimuliziMix';
  let message = 'Hadithi mpya inakusubiri leo — fungua SimuliziMix!';

  if (eatHour >= 5 && eatHour < 12) {
    heading = 'SimuliziMix ☀️ Asubuhi';
    message = 'Habari za asubuhi! Simulizi mpya na za kusisimua zinakusubiri. Fungua usikilize leo!';
  } else if (eatHour >= 12 && eatHour < 19) {
    heading = 'SimuliziMix 🌆 Jioni';
    message = 'Jioni njema! Tuliza akili yako kwa kusikiliza simulizi bora zaidi kwenye SimuliziMix.';
  } else {
    heading = 'SimuliziMix 🌙 Usiku';
    message = 'Usiku mwema! Pata simulizi nzuri za kukusindikiza usiku wa leo kwenye SimuliziMix.';
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
        headings: { en: heading, sw: heading },
        contents: { en: message, sw: message },
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
