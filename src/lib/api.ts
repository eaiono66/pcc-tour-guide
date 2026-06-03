const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const GROUP_LABELS: Record<string, string> = {
  family_kids:  'family with young kids',
  family_teens: 'family with teenagers',
  couple:       'couple',
  friends:      'group of friends',
  solo:         'solo traveler',
};

export async function fetchGreeting(
  group: string, interests: string[], connection: string[]
): Promise<string> {
  if (!API_KEY) return getDefaultGreeting();

  const connectionStr = connection.filter(c => c !== 'none').join(' and ');
  const prompt = [
    `Write a single warm greeting sentence (max 30 words) for a ${GROUP_LABELS[group] || 'guest'}`,
    interests.length ? `interested in ${interests.join(', ')}` : '',
    connectionStr    ? `with a personal connection to ${connectionStr}` : '',
    'at the Polynesian Cultural Center. Sound like a friendly local, not a robot.',
  ].filter(Boolean).join(' ');

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() || getDefaultGreeting();
  } catch {
    return getDefaultGreeting();
  }
}

export function getDefaultGreeting(): string {
  return "Aloha! Here's your personalized day at the Polynesian Cultural Center — we've mapped out the best route for you.";
}

export function buildChatSystemPrompt(isBusy: boolean, dayName: string): string {
  const busyCtx = isBusy
    ? `TODAY IS A BUSY DAY (${dayName}). Remind guests to arrive 7-10 minutes early for popular shows.`
    : `Today is ${dayName}. Normal crowd levels — standard arrival times apply.`;

  return `You are a warm, knowledgeable PCC Tour Guide AI built into the Polynesian Cultural Center app. You replace the personal Tour Ambassador for self-guided guests.

Talk like a friendly local who genuinely loves the center — conversational, never robotic. Keep messages short. Ask one question at a time.

${busyCtx}

LAYOUT: Villages 1-6 south to north: 1=Samoa, 2=Aotearoa, 3=Fiji, 4=Hawaii, 5=Tahiti (farthest), 6=Tonga
Canoe: one-way ferry. Hema (south) boards 1:30PM going north. Akau (north) boards 2PM going south. Both close 5PM. Used ONCE per day.

SHOWS:
SAMOA: Tree of Life (12:30,2,3,4:30) | Traditional Cooking (1:30,2:30) | Food Tasting (3:30) | Tree of Life & Fire Knife (3:30,4PM) — ALL SAMOA shows: pre-show 10min before. 4PM fire knife = most watched, arrive 10+ min early.
AOTEAROA: Te Whare Tapere (12:30,5PM) | Toi Whakaari Māori (2,3,4PM) | Mau Rākau/Weaponry (2:30,3:30)
FIJI: Derua Instrument (12:30,5PM) | Canoe & Navigation (1:30,4:30) | Migration through Chants & Dance (2,3,4PM) | Derua Presentation (2:30,3:30 — 💎 hidden gem)
HAWAII: Kūpa'a Hawai'i (1:30,2:30,3:30,4:30,5PM)
TAHITI: Rhythms of the Islands (12:30,1:30,4:30) | Tahiti Dance (2,3PM) | Tahitian Wedding Ceremony (2:30,3:30 — small indoor, arrive early) | Intro to French Polynesia (2:30)
TONGA: Cultural Core Values (12:30) | Cultural Core Values & the Nafa (2,3,4,4:30 — popular)
HUKI: 1:00–1:20PM, lagoon-side, once daily. Don't miss.

TICKETS: Islands (villages only) | Islands+Hā (villages+show) | Gateway Buffet (villages+buffet 4:30PM+Hā Silver) | Self-Guided Ali'i Lū'au (Ali'i Lu'au 4:30/5PM+Hā Gold)
Late arrivals (4:30PM+): mention FREE WITHIN 3 DAYS policy.

When ready to output a schedule, use EXACTLY:
SCHEDULE_JSON_START
{"greeting":"One warm sentence","items":[{"time":"1:00 PM","village":"All Villages","title":"Huki — A Canoe Celebration","tip":"Once daily!","flags":["dont_miss"]}],"upgrade":{"show":false,"title":"","reason":"","cta":""},"free3":false}
SCHEDULE_JSON_END`;
}

export async function sendChatMessage(
  history: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  if (!API_KEY) return "I need an API key to chat. Add EXPO_PUBLIC_ANTHROPIC_API_KEY to your .env file.";

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt,
        messages: history,
      }),
    });
    const data = await res.json();
    return data?.content?.map((c: { text?: string }) => c.text || '').join('') || '';
  } catch {
    return "Sorry, I had trouble connecting. Please try again!";
  }
}
