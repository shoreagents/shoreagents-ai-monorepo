import dotenv from 'dotenv';
dotenv.config();

import { WebClient } from '@slack/web-api';

async function debugNovaDMIssue() {
  console.log('🔍 Debugging NOVA DM Issue...');

  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

  // 1. Test authentication
  console.log('\n1. Testing authentication...');
  try {
    const authTest = await slack.auth.test();
    console.log('✅ Authenticated as:', authTest.user);
    console.log('✅ Bot ID:', authTest.user_id);
    console.log('✅ Team:', authTest.team);
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    return;
  }

  // 2. Check app info
  console.log('\n2. Checking app info...');
  try {
    const appInfo = await slack.apps.info();
    console.log('✅ App Name:', appInfo.app.name);
    console.log('✅ App ID:', appInfo.app.id);
    console.log('✅ App Scopes:', appInfo.app.scopes?.oauth?.bot || 'No scopes found');
  } catch (error) {
    console.error('❌ Cannot get app info:', error.message);
  }

  // 3. Check bot info
  console.log('\n3. Checking bot info...');
  try {
    const botInfo = await slack.bots.info({ bot: 'U09MKQL4Y9L' });
    console.log('✅ Bot Name:', botInfo.bot.name);
    console.log('✅ Bot ID:', botInfo.bot.id);
    console.log('✅ Bot Deleted:', botInfo.bot.deleted);
  } catch (error) {
    console.error('❌ Cannot get bot info:', error.message);
  }

  // 4. Test conversation listing
  console.log('\n4. Testing conversation listing...');
  try {
    const conversations = await slack.conversations.list({
      types: 'im',
      limit: 5
    });
    console.log('✅ Can list DM conversations:', conversations.channels?.length || 0, 'found');
    if (conversations.channels && conversations.channels.length > 0) {
      console.log('   Sample DM channels:', conversations.channels.map(c => c.id).slice(0, 3));
    }
  } catch (error) {
    console.error('❌ Cannot list DM conversations:', error.message);
  }

  // 5. Test posting to #general
  console.log('\n5. Testing channel posting...');
  try {
    await slack.chat.postMessage({
      channel: '#general',
      text: '🔍 NOVA DM Debug Test: Checking if I can post messages...',
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    console.log('✅ Can post to channels');
  } catch (error) {
    console.error('❌ Cannot post to channels:', error.message);
  }

  // 6. Check specific DM channel
  console.log('\n6. Testing specific DM channel access...');
  try {
    // Try to get info about a specific DM channel
    const dmChannels = await slack.conversations.list({
      types: 'im',
      limit: 1
    });
    
    if (dmChannels.channels && dmChannels.channels.length > 0) {
      const testChannel = dmChannels.channels[0];
      console.log('✅ Testing DM channel:', testChannel.id);
      
      // Try to get history
      const history = await slack.conversations.history({
        channel: testChannel.id,
        limit: 1
      });
      console.log('✅ Can read DM history');
    }
  } catch (error) {
    console.error('❌ Cannot access DM channels:', error.message);
  }

  console.log('\n🎉 Debug complete!');
  console.log('💡 If you see errors above, those are the issues to fix.');
}

debugNovaDMIssue().catch(console.error);
