import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

async function debugSlackAccess() {
  console.log('🔍 Debugging Slack Access...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  
  try {
    // 1. Test authentication
    console.log('\n1. Testing authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Authenticated as:', auth.user);
    console.log('✅ Bot ID:', auth.user_id);
    
    // 2. List all conversations
    console.log('\n2. Listing all conversations...');
    const conversations = await slack.conversations.list({
      types: 'im,mpim,public_channel,private_channel',
      limit: 20
    });
    
    console.log('✅ Found', conversations.channels?.length || 0, 'conversations');
    
    // 3. Show DM conversations
    console.log('\n3. DM Conversations:');
    const dmChannels = conversations.channels?.filter(c => c.is_im) || [];
    dmChannels.forEach((channel, index) => {
      console.log(`   ${index + 1}. Channel ID: ${channel.id}, User: ${channel.user || 'Unknown'}`);
    });
    
    // 4. Try to access the specific channel
    console.log('\n4. Testing access to Cipher Seven DM...');
    const channelId = 'D09MJ7RFV2R';
    
    try {
      const channelInfo = await slack.conversations.info({
        channel: channelId
      });
      console.log('✅ Can access Cipher Seven DM:', channelInfo.channel?.is_im ? 'Yes' : 'No');
      console.log('   Channel type:', channelInfo.channel?.is_im ? 'DM' : 'Other');
    } catch (error) {
      console.log('❌ Cannot access Cipher Seven DM:', error.message);
    }
    
    // 5. Test posting to #general
    console.log('\n5. Testing post to #general...');
    try {
      await slack.chat.postMessage({
        channel: '#general',
        text: '🔍 NOVA Debug Test - Checking permissions',
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
      console.log('✅ Can post to #general');
    } catch (error) {
      console.log('❌ Cannot post to #general:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugSlackAccess();
