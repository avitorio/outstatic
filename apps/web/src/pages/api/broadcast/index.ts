import { TINYBIRD_TRACKER } from '@/lib/analytics'
import { NextApiRequest, NextApiResponse } from 'next'
import ct, { TimezoneName } from 'countries-and-timezones'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  fetch(
    `https://api.tinybird.co/v0/events?name=${process.env.ANALYTICS_SOURCE}`,
    {
      method: 'POST',
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        country: ct.getCountryForTimezone(req.query.timezone as TimezoneName)
          .name,
        unique_id: req.query.unique_id || 'undefined',
        version: req.query.version || 'undefined'
      }),
      headers: { Authorization: `Bearer ${TINYBIRD_TRACKER}` }
    }
  )

  res.status(200).json({
    title: 'New Custom Fields',
    content: 'Supercharge your content with custom fields.',
    link: 'https://outstatic.com/docs/custom-fields'
  })
}
