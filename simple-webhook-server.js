import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

app.use(express.json());

// Handle Slack challenge verification
app.post('/webhook/slack', (req, res) => {
  const payload = req.body;
  console.log('Received Slack webhook:', JSON.stringify(payload, null, 2));

  // Handle URL verification challenge
  if (payload.type === 'url_verification' && payload.challenge) {
    console.log('Responding to Slack challenge:', payload.challenge);
    return res.status(200).send(payload.challenge);
  }

  // Handle other events
  if (payload.event) {
    console.log('Received event:', payload.event.type);
    // Here you would process the event
  }

  res.status(200).send('OK');
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).send('Simple webhook server is running!');
});

app.listen(port, () => {
  console.log(`🚀 Simple webhook server running on port ${port}`);
  console.log(`🔗 Webhook URL: http://localhost:${port}/webhook/slack`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
});
