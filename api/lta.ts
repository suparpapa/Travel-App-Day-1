import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless Handler for Singapore LTA DataMall
 * Base URL: https://datamall2.mytransport.sg/ltaodataservice
 * Header: AccountKey: <LTA_DATAMALL_KEY>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const {
    endpoint = 'BusArrival',
    busStopCode,
    serviceNo,
    skip,
  } = req.query;

  const endpointParam = Array.isArray(endpoint) ? endpoint[0] : endpoint;
  const busStopCodeParam = Array.isArray(busStopCode) ? busStopCode[0] : busStopCode;
  const serviceNoParam = Array.isArray(serviceNo) ? serviceNo[0] : serviceNo;
  const skipParam = Array.isArray(skip) ? skip[0] : skip;

  const accountKey =
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_API_KEY ||
    (req.headers['accountkey'] as string) ||
    '';

  if (!accountKey) {
    return res.status(401).json({
      error: 'LTA_DATAMALL_KEY is not configured',
      message: 'Please set the LTA_DATAMALL_KEY environment variable in Vercel project settings to pull live transport data.',
      availableEndpoints: [
        'BusArrival (requires busStopCode, optional serviceNo)',
        'BusStops (optional skip)',
        'TrainServiceAlerts',
        'TrafficIncidents',
        'TaxiAvailability',
      ],
    });
  }

  try {
    let targetPath = String(endpointParam);
    const queryParams = new URLSearchParams();

    if (endpointParam === 'BusArrival') {
      targetPath = 'v3/BusArrival';
      if (busStopCodeParam) queryParams.set('BusStopCode', String(busStopCodeParam));
      if (serviceNoParam) queryParams.set('ServiceNo', String(serviceNoParam));
    } else if (endpointParam === 'BusStops') {
      targetPath = 'BusStops';
      if (skipParam) queryParams.set('$skip', String(skipParam));
    } else if (endpointParam === 'TrainAlerts' || endpointParam === 'TrainServiceAlerts') {
      targetPath = 'TrainServiceAlerts';
    } else if (endpointParam === 'TrafficIncidents') {
      targetPath = 'TrafficIncidents';
    } else if (endpointParam === 'TaxiAvailability') {
      targetPath = 'TaxiAvailability';
    }

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const fullUrl = `https://datamall2.mytransport.sg/ltaodataservice/${targetPath}${queryString}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        Accept: 'application/json',
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('LTA DataMall proxy error:', error);
    return res.status(500).json({
      error: 'Failed to fetch live data from LTA DataMall',
      details: error?.message || String(error),
    });
  }
}
