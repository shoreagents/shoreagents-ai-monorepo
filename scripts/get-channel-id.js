import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

async function getChannelId() {
  console.log('🔍 Getting Channel IDs...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    
    // 2. List all channels
    console.log('\n2. Getting all channels...');
    const channels = await slack.conversations.list({
      types: 'public_channel,private_channel',
      limit: 100
    });
    
    if (!channels.ok) {
      console.log('❌ Failed to list channels:', channels.error);
      return;
    }
    
    console.log(`✅ Found ${channels.channels.length} channels:`);
    
    // Find #general channel
    const generalChannel = channels.channels.find(ch => ch.name === 'general');
    if (generalChannel) {
      console.log(`\n🎯 #general channel found:`);
      console.log(`   Name: ${generalChannel.name}`);
      console.log(`   ID: ${generalChannel.id}`);
      console.log(`   Is Member: ${generalChannel.is_member}`);
    } else {
      console.log('\n❌ #general channel not found');
    }
    
    // Show all channels for reference
    console.log('\n📋 All available channels:');
    channels.channels.forEach(ch => {
      console.log(`   ${ch.name} (${ch.id}) - Member: ${ch.is_member}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

getChannelId();
