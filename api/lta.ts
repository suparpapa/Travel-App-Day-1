import type { Request, Response } from 'express';

/**
 * Serverless Handler for Singapore LTA DataMall
 * Base URL: https://datamall2.mytransport.sg/ltaodataservice
 * Header: AccountKey: <LTA_DATAMALL_KEY>
 */
export default async function handler(req: Request, res: Response) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const {
    endpoint = 'BusArrival',
    busStopCode,
    serviceNo,
    skip,
  } = req.query;

  const accountKey =
    process.env.LTA_DATAMALL_KEY ||
    process.env.LTA_API_KEY ||
    (req.headers['accountkey'] as string) ||
    '';

  if (!accountKey) {
    return res.status(401).json({
      error: 'LTA_DATAMALL_KEY is not configured',
      message: 'Please set the LTA_DATAMALL_KEY environment variable to pull live transport data.',
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
    let targetPath = String(endpoint);
    const queryParams = new URLSearchParams();

    if (endpoint === 'BusArrival') {
      targetPath = 'v3/BusArrival';
      if (busStopCode) queryParams.set('BusStopCode', String(busStopCode));
      if (serviceNo) queryParams.set('ServiceNo', String(serviceNo));
    } else if (endpoint === 'BusStops') {
      targetPath = 'BusStops';
      if (skip) queryParams.set('$skip', String(skip));
    } else if (endpoint === 'TrainAlerts' || endpoint === 'TrainServiceAlerts') {
      targetPath = 'TrainServiceAlerts';
    } else if (endpoint === 'TrafficIncidents') {
      targetPath = 'TrafficIncidents';
    } else if (endpoint === 'TaxiAvailability') {
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
