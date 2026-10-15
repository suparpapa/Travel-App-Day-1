import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { topic, options = [], memberNotes = '' } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are an expert Singapore group travel planner and mediator.
The group is in Singapore and currently deadlocked regarding:
Topic: "${topic}"
Options under consideration: ${JSON.stringify(options)}
Group Context & Member notes: "${memberNotes}"

Propose a creative, balanced compromise tailored to Singapore (taking into account Singapore's efficient MRT transit, air-conditioned malls during midday heat, evening outdoor cooler weather, and vibrant hawker culture).

Return JSON format:
{
  "compromiseTitle": "string",
  "recommendedStrategy": "string",
  "suggestedSchedule": [
    { "time": "string", "plan": "string", "forWhom": "string" }
  ],
  "conciliatoryNote": "string (encouraging, friendly Singlish-tinged note for the group chat)"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const text = response.text;
      if (text) {
        return res.status(200).json(JSON.parse(text));
      }
    } catch (err: any) {
      console.error('Gemini conflict resolver serverless error:', err?.message || err);
    }
  }

  // Fallback Compromise
  return res.status(200).json({
    compromiseTitle: "Aircon Afternoon Split & Satay Street Reunion",
    recommendedStrategy: "During the 14:00-16:30 tropical humidity peak, split into Pod A (indoor National Gallery & air-conditioned cafe) and Pod B (Chinatown heritage heritage walk), then take the Downtown Line MRT to reunite at Lau Pa Sat for open-air satay skewers.",
    suggestedSchedule: [
      { time: "14:30 - 16:30", plan: "Pod A relaxes in the chilled National Gallery & craft coffee; Pod B explores Buddha Tooth Relic Temple & pagoda shophouses.", forWhom: "Split by walking vs chill preference" },
      { time: "17:15", plan: "Hop on Telok Ayer MRT (Exit A) to walk to Lau Pa Sat.", forWhom: "Reunited crew" },
      { time: "18:30", plan: "Chope big outdoor wooden table on Boon Tat Street for 50-stick chicken & mutton satay platter.", forWhom: "Entire group celebration" }
    ],
    conciliatoryNote: "No stress lah! Singapore is so compact that splitting for 2 hours and meeting for satay at dusk gives everyone the exact trip pace they want."
  });
}
