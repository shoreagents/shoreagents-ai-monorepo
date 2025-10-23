import { config } from 'dotenv';
import { WebClient } from '@slack/web-api';

// Load environment variables
config();

async function checkSlackPermissions() {
  console.log('🔍 Checking Slack Bot Permissions...');
  
  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  
  try {
    // Test basic auth
    console.log('\n1. Testing basic authentication...');
    const auth = await slack.auth.test();
    console.log('✅ Bot authenticated as:', auth.user);
    console.log('✅ Bot ID:', auth.bot_id);
    console.log('✅ Team:', auth.team);
    
    // Test posting to channels
    console.log('\n2. Testing channel posting...');
    const postResult = await slack.chat.postMessage({
      channel: '#general',
      text: '🔍 NOVA permission test - checking what I can access',
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    console.log('✅ Can post to channels:', postResult.ok);
    
    // Test listing conversations
    console.log('\n3. Testing conversation listing...');
    try {
      const conversations = await slack.conversations.list({
        types: 'im',
        limit: 5
      });
      console.log('✅ Can list conversations:', conversations.ok);
      console.log('✅ Found', conversations.channels?.length || 0, 'conversations');
    } catch (error) {
      console.log('❌ Cannot list conversations:', error.message);
    }
    
    // Test reading channel history
    console.log('\n4. Testing channel history access...');
    try {
      const history = await slack.conversations.history({
        channel: 'C09MFH9JTK5', // #general channel
        limit: 5
      });
      console.log('✅ Can read channel history:', history.ok);
      console.log('✅ Found', history.messages?.length || 0, 'messages');
    } catch (error) {
      console.log('❌ Cannot read channel history:', error.message);
    }
    
    // Test reading DM history
    console.log('\n5. Testing DM history access...');
    try {
      const dmHistory = await slack.conversations.history({
        channel: 'D09M67SBYSK', // Stephen's DM channel
        limit: 5
      });
      console.log('✅ Can read DM history:', dmHistory.ok);
      console.log('✅ Found', dmHistory.messages?.length || 0, 'DM messages');
    } catch (error) {
      console.log('❌ Cannot read DM history:', error.message);
    }
    
    // Test app info
    console.log('\n6. Testing app info...');
    try {
      const appInfo = await slack.apps.info();
      console.log('✅ Can get app info:', appInfo.ok);
    } catch (error) {
      console.log('❌ Cannot get app info:', error.message);
    }
    
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
  }
}

checkSlackPermissions().catch(console.error);
