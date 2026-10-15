import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const onemapConfigured = Boolean(process.env.ONEMAP_TOKEN || process.env.ONEMAP_API_KEY);
  const ltaConfigured = Boolean(process.env.LTA_DATAMALL_KEY || process.env.LTA_API_KEY);
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);

  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    integrations: {
      onemap: {
        configured: onemapConfigured,
        description: 'Singapore OneMap Reverse Geocoding & Addressing API',
        envKey: 'ONEMAP_TOKEN',
      },
      ltaDatamall: {
        configured: ltaConfigured,
        description: 'Singapore LTA DataMall Public Transport & Traffic API',
        envKey: 'LTA_DATAMALL_KEY',
      },
      gemini: {
        configured: geminiConfigured,
        envKey: 'GEMINI_API_KEY',
      },
    },
  });
}
