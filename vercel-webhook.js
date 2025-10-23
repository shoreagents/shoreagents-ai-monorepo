// Vercel serverless function for Slack webhooks
export default function handler(req, res) {
  // Handle Slack challenge verification
  if (req.method === 'POST' && req.body.type === 'url_verification') {
    console.log('Responding to Slack challenge:', req.body.challenge);
    return res.status(200).send(req.body.challenge);
  }

  // Handle other Slack events
  if (req.method === 'POST' && req.body.event) {
    console.log('Received Slack event:', req.body.event.type);
    
    // Here you would process the event
    // For now, just acknowledge receipt
    return res.status(200).json({ received: true });
  }

  // Health check
  if (req.method === 'GET') {
    return res.status(200).json({ status: 'OK', service: 'Slack Webhook Handler' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
