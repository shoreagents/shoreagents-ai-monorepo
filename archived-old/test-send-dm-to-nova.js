import dotenv from 'dotenv';
dotenv.config();

import { WebClient } from '@slack/web-api';

async function testSendDMToNova() {
  console.log('🧪 Testing sending DM to NOVA...');

  const slack = new WebClient(process.env.SLACK_BOT_TOKEN);
  const novaBotUserId = 'U09MKQL4Y9L'; // Nova Agent001 User ID

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

  // 2. Try to open a DM with NOVA herself (self-DM test)
  console.log('\n2. Testing self-DM capability...');
  try {
    const conversation = await slack.conversations.open({
      users: novaBotUserId
    });
    console.log('✅ Can open DM with NOVA:', conversation.channel.id);
    
    // Try to send a message to the DM
    const result = await slack.chat.postMessage({
      channel: conversation.channel.id,
      text: '🧪 Test message from NOVA to herself - DM functionality test',
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    console.log('✅ Can send DM to NOVA:', result.ts);
  } catch (error) {
    console.error('❌ Cannot send DM to NOVA:', error.message);
  }

  // 3. Try to send a DM to a different user (you)
  console.log('\n3. Testing DM to different user...');
  try {
    // Get your user ID from auth
    const authTest = await slack.auth.test();
    const yourUserId = authTest.user_id;
    
    const conversation = await slack.conversations.open({
      users: yourUserId
    });
    console.log('✅ Can open DM with you:', conversation.channel.id);
    
    const result = await slack.chat.postMessage({
      channel: conversation.channel.id,
      text: '🧪 Test DM from NOVA to you - DM functionality test',
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    console.log('✅ Can send DM to you:', result.ts);
  } catch (error) {
    console.error('❌ Cannot send DM to you:', error.message);
  }

  // 4. Post status to #general
  console.log('\n4. Posting status to #general...');
  try {
    await slack.chat.postMessage({
      channel: '#general',
      text: '🧪 NOVA DM Test Complete: Check your DMs to see if I can send messages!',
      username: "Nova Agent001",
      icon_emoji: ":robot_face:"
    });
    console.log('✅ Status posted to #general');
  } catch (error) {
    console.error('❌ Cannot post to #general:', error.message);
  }

  console.log('\n🎉 DM test complete!');
  console.log('💬 Check your DMs to see if NOVA sent you any messages!');
}

testSendDMToNova().catch(console.error);
