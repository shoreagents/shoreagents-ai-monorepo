import dotenv from 'dotenv';
dotenv.config();

import { WebClient } from '@slack/web-api';

async function testDMPermissions() {
  console.log('🔍 Testing DM Permissions...');

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

  // 2. Test DM conversation listing
  console.log('\n2. Testing DM conversation listing...');
  try {
    const conversations = await slack.conversations.list({
      types: 'im',
      limit: 5
    });
    console.log('✅ Can list DM conversations:', conversations.channels?.length || 0, 'found');
  } catch (error) {
    console.error('❌ Cannot list DM conversations:', error.message);
  }

  // 3. Test sending a DM to yourself (if possible)
  console.log('\n3. Testing DM sending capability...');
  try {
    // Get bot info
    const botInfo = await slack.bots.info({ bot: 'U09MKQL4Y9L' });
    console.log('✅ Bot info retrieved:', botInfo.bot.name);
  } catch (error) {
    console.error('❌ Cannot get bot info:', error.message);
  }

  // 4. Test posting to #general
  console.log('\n4. Testing channel posting...');
  try {
    await slack.chat.postMessage({
      channel: '#general',
      text: '🧪 DM Permissions Test: NOVA is checking if she can receive DMs now!',
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    console.log('✅ Can post to channels');
  } catch (error) {
    console.error('❌ Cannot post to channels:', error.message);
  }

  console.log('\n🎉 DM permissions test complete!');
  console.log('💬 Now try sending a DM to @Nova Agent001 in Slack!');
}

testDMPermissions().catch(console.error);
