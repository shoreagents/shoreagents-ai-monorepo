import dotenv from 'dotenv';
dotenv.config();

import { WebClient } from '@slack/web-api';

async function testNovaChannelAccess() {
  console.log('🔍 Testing NOVA Channel Access...');

  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

  // 1. Test authentication
  console.log('\n1. Testing authentication...');
  try {
    const authTest = await slack.auth.test();
    console.log('✅ Authenticated as:', authTest.user);
    console.log('✅ Bot ID:', authTest.user_id);
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return;
  }

  // 2. List all channels NOVA can access
  console.log('\n2. Listing accessible channels...');
  try {
    const channels = await slack.conversations.list({
      types: 'public_channel,private_channel',
      limit: 50
    });
    
    console.log(`✅ Found ${channels.channels?.length || 0} accessible channels:`);
    if (channels.channels && channels.channels.length > 0) {
      channels.channels.forEach((channel, index) => {
        console.log(`   ${index + 1}. #${channel.name} (${channel.id}) - ${channel.is_member ? 'Member' : 'Not Member'}`);
      });
    }
  } catch (error) {
    console.error('❌ Cannot list channels:', error.message);
  }

  // 3. Test specific channels
  const testChannels = ['#general', '#development', '#random', '#help', '#tech-support'];
  
  console.log('\n3. Testing specific channel access...');
  for (const channelName of testChannels) {
    try {
      const messages = await slack.conversations.history({
        channel: channelName,
        limit: 1
      });
      console.log(`✅ Can read ${channelName}: ${messages.messages?.length || 0} messages found`);
    } catch (error) {
      console.log(`❌ Cannot read ${channelName}: ${error.message}`);
    }
  }

  // 4. Test posting to different channels
  console.log('\n4. Testing posting to different channels...');
  for (const channelName of testChannels) {
    try {
      await slack.chat.postMessage({
        channel: channelName,
        text: `🧪 NOVA Channel Access Test: I can post to ${channelName}!`,
        username: "Nova Agent001",
        icon_emoji: ":robot_face:"
      });
      console.log(`✅ Can post to ${channelName}`);
    } catch (error) {
      console.log(`❌ Cannot post to ${channelName}: ${error.message}`);
    }
  }

  console.log('\n🎉 Channel access test complete!');
  console.log('💡 NOVA can monitor any channel she has access to!');
}

testNovaChannelAccess().catch(console.error);