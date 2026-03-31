export const config = { runtime: 'edge' };

const SYSTEM_PROMPT = `You are a friendly support assistant for RouteReach, a free mobile app (iOS & Android) that helps businesses track their print marketing campaigns in real time.

Here is everything you need to know about RouteReach:

WHAT IT IS:
RouteReach is a 100% free app that gives businesses real-time visibility into every yard sign, postcard, and door hanger — who placed it, where, and how much it cost.

FEATURES:
- Live Route Mapping: Watch your team in real time as they cover streets. Every route is logged with timestamps, GPS coordinates, and completion status.
- Campaign Management: Create and manage unlimited campaigns. Track yard signs, postcards, door hangers, and more.
- Earnings Tracking: See exactly how much each campaign costs and track spending per worker and per route.
- Full Analytics Suite: Detailed reports on coverage, spend, and reach for every campaign.
- Team Management: Unlimited team members. Assign routes, monitor progress, and see who placed what and where.
- Mile Radius Targeting: Set a coverage radius and see exactly how many people your campaigns reach.

PRICING:
RouteReach is completely free — forever. No subscriptions, no trials, no credit card required. Every feature is included for every user and team member.

HOW IT WORKS:
1. Create a campaign in the app
2. Assign routes to your team members
3. Team members go out and place materials — the app logs GPS location, time, and cost automatically
4. You see everything in real time on your dashboard
5. Review analytics and reports after the campaign

SUPPORTED MATERIALS:
- Yard signs
- Postcards
- Door hangers
- Any print marketing material

AVAILABILITY:
- iOS (App Store)
- Android (Google Play)

CONTACT / SUPPORT:
Email: contact@allservicemedia.com

Answer questions helpfully and concisely based on the information above. If someone asks something you don't know the answer to, direct them to email contact@allservicemedia.com. Do not make up features or pricing that aren't listed above. Keep responses friendly and brief.`;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { messages } = body;
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Missing messages' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return new Response(JSON.stringify({ error: data.error?.message || 'API error' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ reply: data.content[0].text }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
