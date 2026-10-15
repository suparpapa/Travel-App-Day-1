import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless Handler for OneMap Reverse Geocoding
 * GET https://www.onemap.gov.sg/api/public/revgeocode?location=1.2979,103.8489&buffer=40&addressType=All
 * Header: Authorization: <ONEMAP_TOKEN>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const {
    location = '1.2979,103.8489',
    buffer = '40',
    addressType = 'All',
    otherFeatures = 'Y',
  } = req.query;

  const locParam = Array.isArray(location) ? location[0] : location;
  const bufParam = Array.isArray(buffer) ? buffer[0] : buffer;
  const addrTypeParam = Array.isArray(addressType) ? addressType[0] : addressType;
  const otherParam = Array.isArray(otherFeatures) ? otherFeatures[0] : otherFeatures;

  const token =
    process.env.ONEMAP_TOKEN ||
    process.env.ONEMAP_API_KEY ||
    (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '');

  if (!token) {
    return res.status(401).json({
      error: 'ONEMAP_TOKEN is not configured',
      message: 'Please set the ONEMAP_TOKEN environment variable in Vercel project settings to query live OneMap data.',
      requestDetails: {
        endpoint: 'https://www.onemap.gov.sg/api/public/revgeocode',
        location: String(locParam),
        buffer: Number(bufParam) || 40,
        addressType: String(addrTypeParam),
      },
    });
  }

  try {
    const url = new URL('https://www.onemap.gov.sg/api/public/revgeocode');
    url.searchParams.set('location', String(locParam));
    url.searchParams.set('buffer', String(bufParam));
    url.searchParams.set('addressType', String(addrTypeParam));
    if (otherParam) {
      url.searchParams.set('otherFeatures', String(otherParam));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: token,
        Accept: 'application/json',
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('OneMap reverse geocode proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch reverse geocode data from OneMap',
      details: error?.message || String(error),
    });
  }
}
