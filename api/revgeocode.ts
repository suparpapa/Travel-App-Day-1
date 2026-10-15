import type { Request, Response } from 'express';

/**
 * Serverless Handler for OneMap Reverse Geocoding
 * GET https://www.onemap.gov.sg/api/public/revgeocode?location=1.2979,103.8489&buffer=40&addressType=All
 * Header: Authorization: <ONEMAP_TOKEN>
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const {
    location = '1.2979,103.8489',
    buffer = '40',
    addressType = 'All',
    otherFeatures = 'Y',
  } = req.query;

  const token =
    process.env.ONEMAP_TOKEN ||
    process.env.ONEMAP_API_KEY ||
    (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '');

  if (!token) {
    return res.status(401).json({
      error: 'ONEMAP_TOKEN is not configured',
      message: 'Please set the ONEMAP_TOKEN environment variable to query live OneMap data.',
      requestDetails: {
        endpoint: 'https://www.onemap.gov.sg/api/public/revgeocode',
        location: String(location),
        buffer: Number(buffer),
        addressType: String(addressType),
      },
    });
  }

  try {
    const url = new URL('https://www.onemap.gov.sg/api/public/revgeocode');
    url.searchParams.set('location', String(location));
    url.searchParams.set('buffer', String(buffer));
    url.searchParams.set('addressType', String(addressType));
    if (otherFeatures) {
      url.searchParams.set('otherFeatures', String(otherFeatures));
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
