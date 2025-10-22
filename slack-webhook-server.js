import express from 'express';

const app = express();
const port = 3001;

// Middleware to parse JSON
app.use(express.json());

// Slack webhook endpoint
app.post('/webhook/slack', (req, res) => {
  console.log('Received Slack webhook:', JSON.stringify(req.body, null, 2));
  
  // Handle Slack URL verification challenge
  if (req.body.type === 'url_verification') {
    console.log('Responding to Slack challenge:', req.body.challenge);
    return res.status(200).send(req.body.challenge);
  }
  
  // Handle other Slack events
  if (req.body.type === 'event_callback') {
    const event = req.body.event;
    console.log('Slack event received:', event.type);
    
    // Here you would process the event and have NOVA respond
    // For now, just log it
    if (event.type === 'app_mention') {
      console.log('NOVA was mentioned:', event.text);
    } else if (event.type === 'message' && event.channel_type === 'im') {
      console.log('NOVA received DM:', event.text);
    }
  }
  
  // Always respond with 200 OK
  res.status(200).send('OK');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Slack webhook server is running!');
});

app.listen(port, () => {
  console.log(`🚀 Slack webhook server running on port ${port}`);
  console.log(`🔗 Webhook URL: http://localhost:${port}/webhook/slack`);
  console.log(`🌐 Health check: http://localhost:${port}/health`);
});
