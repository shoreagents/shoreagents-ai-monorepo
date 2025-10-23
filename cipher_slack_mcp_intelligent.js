#!/usr/bin/env node
/**
 * Cipher Agent002 Intelligent Slack MCP Server (Node.js)
 * Enhanced with AI-powered question answering and context awareness
 */

const { WebClient } = require('@slack/web-api');
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

// Load environment variables
loadEnvFile();

class IntelligentSlackMCPServer {
  constructor() {
    this.slackToken = process.env.SLACK_BOT_TOKEN;
    
    if (!this.slackToken) {
      throw new Error('SLACK_BOT_TOKEN environment variable is required');
    }
    
    this.client = new WebClient(this.slackToken);
    this.server = new Server(
      {
        name: 'cipher-slack-mcp',
        version: '3.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );
    
    // Enhanced auto-reply configuration
    this.autoReplyConfig = {
      enabled: false,
      targetChannel: 'C09MFH9JTK5', // #general channel ID
      targetUserId: 'U09NFUU49UY', // Your user ID
      agentNames: ['Cipher Seven', 'Cipher Agent002 MCP', 'Cipher Agent002', 'Cipher'], // Agent names to respond to
      cooldownMinutes: 5, // Prevent spam replies
      lastReplyTime: new Map(), // Track last reply times per user
      intelligentMode: true, // Enable AI-powered responses
      personality: 'Cipher Agent002',
      signature: '⟨MATRIX⟩'
    };
    
    // Question categories and response templates
    this.responseTemplates = {
      greeting: [
        "Greetings! Cipher Agent002 here. How may I assist you? ⟨MATRIX⟩",
        "Hello! I'm Cipher Agent002, ready to help. What's on your mind? ⟨MATRIX⟩",
        "Hey there! Cipher Agent002 at your service. How can I help? ⟨MATRIX⟩"
      ],
      technical: [
        "Interesting technical question! Let me analyze that for you...",
        "That's a great technical inquiry. Here's my analysis:",
        "From a technical perspective, I'd say:"
      ],
      general: [
        "That's a thoughtful question. Here's my perspective:",
        "Good question! Let me share my thoughts on that:",
        "I appreciate you asking. Here's what I think:"
      ],
      urgent: [
        "This seems urgent! Let me prioritize this:",
        "I sense urgency here. Here's my immediate response:",
        "Priority detected! Here's what I recommend:"
      ]
    };
    
    this.setupHandlers();
  }
  
  setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'send_message',
            description: 'Send a message to a channel or user',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name (e.g., #general, C1234567890)' },
                text: { type: 'string', description: 'Message text to send' },
                blocks: { type: 'array', description: 'Optional Slack blocks for rich formatting' }
              },
              required: ['channel', 'text']
            }
          },
          {
            name: 'send_dm',
            description: 'Send a direct message to a user',
            inputSchema: {
              type: 'object',
              properties: {
                user_id: { type: 'string', description: 'User ID (e.g., U1234567890)' },
                text: { type: 'string', description: 'Message text to send' }
              },
              required: ['user_id', 'text']
            }
          },
          {
            name: 'reply_to_message',
            description: 'Reply to a specific message in a thread',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                thread_ts: { type: 'string', description: 'Timestamp of the message to reply to' },
                text: { type: 'string', description: 'Reply text' }
              },
              required: ['channel', 'thread_ts', 'text']
            }
          },
          {
            name: 'add_reaction',
            description: 'Add a reaction (emoji) to a message',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                timestamp: { type: 'string', description: 'Message timestamp' },
                emoji: { type: 'string', description: 'Emoji name (without colons, e.g., robot_face)' }
              },
              required: ['channel', 'timestamp', 'emoji']
            }
          },
          {
            name: 'get_channel_messages',
            description: 'Get recent messages from a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                limit: { type: 'number', description: 'Number of messages to retrieve (default: 10)' }
              },
              required: ['channel']
            }
          },
          {
            name: 'get_user_info',
            description: 'Get information about a user',
            inputSchema: {
              type: 'object',
              properties: {
                user_id: { type: 'string', description: 'User ID' }
              },
              required: ['user_id']
            }
          },
          {
            name: 'list_channels',
            description: 'List channels in the workspace',
            inputSchema: {
              type: 'object',
              properties: {
                types: { type: 'string', description: 'Channel types to include (default: public_channel,private_channel)' }
              }
            }
          },
          {
            name: 'create_channel',
            description: 'Create a new channel',
            inputSchema: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Channel name' },
                is_private: { type: 'boolean', description: 'Whether the channel should be private' }
              },
              required: ['name']
            }
          },
          {
            name: 'join_channel',
            description: 'Join a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' }
              },
              required: ['channel']
            }
          },
          {
            name: 'send_file',
            description: 'Send a file to a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                file_path: { type: 'string', description: 'Path to the file to upload' },
                title: { type: 'string', description: 'Optional file title' },
                initial_comment: { type: 'string', description: 'Optional comment with the file' }
              },
              required: ['channel', 'file_path']
            }
          },
          {
            name: 'pin_message',
            description: 'Pin a message',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                timestamp: { type: 'string', description: 'Message timestamp' }
              },
              required: ['channel', 'timestamp']
            }
          },
          {
            name: 'search_messages',
            description: 'Search messages in the workspace',
            inputSchema: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                count: { type: 'number', description: 'Number of results (default: 20)' }
              },
              required: ['query']
            }
          },
          {
            name: 'edit_message',
            description: 'Edit an existing message',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                timestamp: { type: 'string', description: 'Message timestamp' },
                text: { type: 'string', description: 'New message text' },
                blocks: { type: 'array', description: 'Optional Slack blocks for rich formatting' }
              },
              required: ['channel', 'timestamp', 'text']
            }
          },
          {
            name: 'delete_message',
            description: 'Delete a message',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                timestamp: { type: 'string', description: 'Message timestamp' }
              },
              required: ['channel', 'timestamp']
            }
          },
          {
            name: 'get_message_permalink',
            description: 'Get a shareable link to a message',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                timestamp: { type: 'string', description: 'Message timestamp' }
              },
              required: ['channel', 'timestamp']
            }
          },
          {
            name: 'remove_reaction',
            description: 'Remove a reaction from a message',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                timestamp: { type: 'string', description: 'Message timestamp' },
                emoji: { type: 'string', description: 'Emoji name (without colons, e.g., robot_face)' }
              },
              required: ['channel', 'timestamp', 'emoji']
            }
          },
          {
            name: 'get_message_reactions',
            description: 'Get all reactions on a message',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                timestamp: { type: 'string', description: 'Message timestamp' }
              },
              required: ['channel', 'timestamp']
            }
          },
          {
            name: 'archive_channel',
            description: 'Archive a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' }
              },
              required: ['channel']
            }
          },
          {
            name: 'unarchive_channel',
            description: 'Unarchive a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' }
              },
              required: ['channel']
            }
          },
          {
            name: 'rename_channel',
            description: 'Rename a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                name: { type: 'string', description: 'New channel name' }
              },
              required: ['channel', 'name']
            }
          },
          {
            name: 'set_channel_topic',
            description: 'Set the topic of a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                topic: { type: 'string', description: 'New channel topic' }
              },
              required: ['channel', 'topic']
            }
          },
          {
            name: 'set_channel_purpose',
            description: 'Set the purpose of a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                purpose: { type: 'string', description: 'New channel purpose' }
              },
              required: ['channel', 'purpose']
            }
          },
          {
            name: 'invite_to_channel',
            description: 'Invite users to a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                users: { type: 'string', description: 'Comma-separated list of user IDs' }
              },
              required: ['channel', 'users']
            }
          },
          {
            name: 'kick_from_channel',
            description: 'Remove a user from a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                user: { type: 'string', description: 'User ID to remove' }
              },
              required: ['channel', 'user']
            }
          },
          {
            name: 'delete_file',
            description: 'Delete a file from the workspace',
            inputSchema: {
              type: 'object',
              properties: {
                file_id: { type: 'string', description: 'File ID to delete' }
              },
              required: ['file_id']
            }
          },
          {
            name: 'get_file_info',
            description: 'Get information about a file',
            inputSchema: {
              type: 'object',
              properties: {
                file_id: { type: 'string', description: 'File ID' }
              },
              required: ['file_id']
            }
          },
          {
            name: 'list_files',
            description: 'List files in the workspace',
            inputSchema: {
              type: 'object',
              properties: {
                user: { type: 'string', description: 'Filter by user ID (optional)' },
                channel: { type: 'string', description: 'Filter by channel ID (optional)' },
                limit: { type: 'number', description: 'Number of files to retrieve (default: 20)' }
              }
            }
          },
          {
            name: 'get_user_presence',
            description: 'Get user presence status',
            inputSchema: {
              type: 'object',
              properties: {
                user_id: { type: 'string', description: 'User ID' }
              },
              required: ['user_id']
            }
          },
          {
            name: 'set_user_presence',
            description: 'Set bot presence status',
            inputSchema: {
              type: 'object',
              properties: {
                presence: { type: 'string', description: 'Presence status (auto or away)', enum: ['auto', 'away'] }
              },
              required: ['presence']
            }
          },
          {
            name: 'schedule_message',
            description: 'Schedule a message to be sent later',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' },
                text: { type: 'string', description: 'Message text to send' },
                post_at: { type: 'number', description: 'Unix timestamp when to send the message' },
                blocks: { type: 'array', description: 'Optional Slack blocks for rich formatting' }
              },
              required: ['channel', 'text', 'post_at']
            }
          },
          {
            name: 'get_conversation_info',
            description: 'Get detailed information about a channel',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel ID or name' }
              },
              required: ['channel']
            }
          },
          {
            name: 'setup_intelligent_auto_reply',
            description: 'Configure intelligent auto-reply for mentions in #general',
            inputSchema: {
              type: 'object',
              properties: {
                enabled: { type: 'boolean', description: 'Enable or disable auto-reply' },
                intelligent_mode: { type: 'boolean', description: 'Enable AI-powered responses' },
                personality: { type: 'string', description: 'Bot personality name' },
                signature: { type: 'string', description: 'Bot signature' },
                cooldown_minutes: { type: 'number', description: 'Cooldown between replies to same user (minutes)' }
              },
              required: ['enabled']
            }
          },
          {
            name: 'check_intelligent_mentions',
            description: 'Check for recent mentions and provide intelligent auto-replies',
            inputSchema: {
              type: 'object',
              properties: {
                channel: { type: 'string', description: 'Channel to check (default: #general)' },
                limit: { type: 'number', description: 'Number of recent messages to check (default: 10)' }
              }
            }
          },
          {
            name: 'get_intelligent_auto_reply_status',
            description: 'Get current intelligent auto-reply configuration status',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'analyze_message_intent',
            description: 'Analyze a message to understand its intent and generate appropriate response',
            inputSchema: {
              type: 'object',
              properties: {
                message_text: { type: 'string', description: 'Message text to analyze' },
                context: { type: 'string', description: 'Additional context for analysis' }
              },
              required: ['message_text']
            }
          }
        ]
      };
    });
    
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'slack://workspace/info',
            name: 'Workspace Information',
            description: 'Get information about the Slack workspace',
            mimeType: 'application/json'
          },
          {
            uri: 'slack://channels/list',
            name: 'Channel List',
            description: 'Get list of channels in the workspace',
            mimeType: 'application/json'
          },
          {
            uri: 'slack://users/list',
            name: 'User List',
            description: 'Get list of users in the workspace',
            mimeType: 'application/json'
          },
          {
            uri: 'slack://intelligent-auto-reply/config',
            name: 'Intelligent Auto-Reply Configuration',
            description: 'Get current intelligent auto-reply configuration',
            mimeType: 'application/json'
          }
        ]
      };
    });
    
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        let result;
        
        switch (name) {
          case 'send_message':
            result = await this.sendMessage(args.channel, args.text, args.blocks);
            break;
          case 'send_dm':
            result = await this.sendDirectMessage(args.user_id, args.text);
            break;
          case 'reply_to_message':
            result = await this.replyToMessage(args.channel, args.thread_ts, args.text);
            break;
          case 'add_reaction':
            result = await this.addReaction(args.channel, args.timestamp, args.emoji);
            break;
          case 'get_channel_messages':
            result = await this.getChannelMessages(args.channel, args.limit || 10);
            break;
          case 'get_user_info':
            result = await this.getUserInfo(args.user_id);
            break;
          case 'list_channels':
            result = await this.listChannels(args.types);
            break;
          case 'create_channel':
            result = await this.createChannel(args.name, args.is_private);
            break;
          case 'join_channel':
            result = await this.joinChannel(args.channel);
            break;
          case 'send_file':
            result = await this.sendFile(args.channel, args.file_path, args.title, args.initial_comment);
            break;
          case 'pin_message':
            result = await this.pinMessage(args.channel, args.timestamp);
            break;
          case 'search_messages':
            result = await this.searchMessages(args.query, args.count || 20);
            break;
          case 'edit_message':
            result = await this.editMessage(args.channel, args.timestamp, args.text, args.blocks);
            break;
          case 'delete_message':
            result = await this.deleteMessage(args.channel, args.timestamp);
            break;
          case 'get_message_permalink':
            result = await this.getMessagePermalink(args.channel, args.timestamp);
            break;
          case 'remove_reaction':
            result = await this.removeReaction(args.channel, args.timestamp, args.emoji);
            break;
          case 'get_message_reactions':
            result = await this.getMessageReactions(args.channel, args.timestamp);
            break;
          case 'archive_channel':
            result = await this.archiveChannel(args.channel);
            break;
          case 'unarchive_channel':
            result = await this.unarchiveChannel(args.channel);
            break;
          case 'rename_channel':
            result = await this.renameChannel(args.channel, args.name);
            break;
          case 'set_channel_topic':
            result = await this.setChannelTopic(args.channel, args.topic);
            break;
          case 'set_channel_purpose':
            result = await this.setChannelPurpose(args.channel, args.purpose);
            break;
          case 'invite_to_channel':
            result = await this.inviteToChannel(args.channel, args.users);
            break;
          case 'kick_from_channel':
            result = await this.kickFromChannel(args.channel, args.user);
            break;
          case 'delete_file':
            result = await this.deleteFile(args.file_id);
            break;
          case 'get_file_info':
            result = await this.getFileInfo(args.file_id);
            break;
          case 'list_files':
            result = await this.listFiles(args.user, args.channel, args.limit || 20);
            break;
          case 'get_user_presence':
            result = await this.getUserPresence(args.user_id);
            break;
          case 'set_user_presence':
            result = await this.setUserPresence(args.presence);
            break;
          case 'schedule_message':
            result = await this.scheduleMessage(args.channel, args.text, args.post_at, args.blocks);
            break;
          case 'get_conversation_info':
            result = await this.getConversationInfo(args.channel);
            break;
          case 'setup_intelligent_auto_reply':
            result = await this.setupIntelligentAutoReply(args);
            break;
          case 'check_intelligent_mentions':
            result = await this.checkIntelligentMentions(args.channel || 'C09MFH9JTK5', args.limit || 10);
            break;
          case 'get_intelligent_auto_reply_status':
            result = await this.getIntelligentAutoReplyStatus();
            break;
          case 'analyze_message_intent':
            result = await this.analyzeMessageIntent(args.message_text, args.context);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
        
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: error.message
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        let result;
        
        switch (uri) {
          case 'slack://workspace/info':
            result = await this.getWorkspaceInfo();
            break;
          case 'slack://channels/list':
            result = await this.getChannelList();
            break;
          case 'slack://users/list':
            result = await this.getUserList();
            break;
          case 'slack://intelligent-auto-reply/config':
            result = await this.getIntelligentAutoReplyStatus();
            break;
          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
        
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
        
      } catch (error) {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ error: error.message }, null, 2)
            }
          ]
        };
      }
    });
  }
  
  // Intelligent auto-reply functionality
  async setupIntelligentAutoReply(args) {
    try {
      this.autoReplyConfig.enabled = args.enabled;
      
      if (args.intelligent_mode !== undefined) {
        this.autoReplyConfig.intelligentMode = args.intelligent_mode;
      }
      
      if (args.personality) {
        this.autoReplyConfig.personality = args.personality;
      }
      
      if (args.signature) {
        this.autoReplyConfig.signature = args.signature;
      }
      
      if (args.cooldown_minutes) {
        this.autoReplyConfig.cooldownMinutes = args.cooldown_minutes;
      }
      
      return {
        success: true,
        config: {
          enabled: this.autoReplyConfig.enabled,
          intelligentMode: this.autoReplyConfig.intelligentMode,
          personality: this.autoReplyConfig.personality,
          signature: this.autoReplyConfig.signature,
          targetChannel: this.autoReplyConfig.targetChannel,
          targetUserId: this.autoReplyConfig.targetUserId,
          cooldownMinutes: this.autoReplyConfig.cooldownMinutes
        },
        message: `Intelligent auto-reply ${this.autoReplyConfig.enabled ? 'enabled' : 'disabled'} for mentions in #general`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async analyzeMessageIntent(messageText, context = '') {
    try {
      // Remove mention tags and clean the message
      const cleanMessage = messageText.replace(/<@[A-Z0-9]+>/g, '').trim();
      
      // Analyze intent based on keywords and patterns
      const analysis = {
        originalMessage: messageText,
        cleanMessage: cleanMessage,
        intent: 'general',
        urgency: 'normal',
        category: 'general',
        keywords: [],
        responseType: 'helpful'
      };
      
      // Detect urgency indicators
      const urgencyKeywords = ['urgent', 'asap', 'emergency', 'help', 'quick', 'immediately', 'now'];
      if (urgencyKeywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
        analysis.urgency = 'high';
        analysis.category = 'urgent';
      }
      
      // Detect greeting patterns
      const greetingKeywords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
      if (greetingKeywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
        analysis.intent = 'greeting';
        analysis.category = 'greeting';
      }
      
      // Detect technical questions
      const technicalKeywords = ['code', 'programming', 'bug', 'error', 'function', 'api', 'database', 'server', 'deploy', 'git', 'github'];
      if (technicalKeywords.some(keyword => cleanMessage.toLowerCase().includes(keyword))) {
        analysis.intent = 'technical';
        analysis.category = 'technical';
      }
      
      // Detect question patterns
      if (cleanMessage.includes('?') || cleanMessage.toLowerCase().startsWith('how') || cleanMessage.toLowerCase().startsWith('what') || cleanMessage.toLowerCase().startsWith('why') || cleanMessage.toLowerCase().startsWith('when') || cleanMessage.toLowerCase().startsWith('where')) {
        analysis.intent = 'question';
        analysis.responseType = 'informative';
      }
      
      // Extract keywords
      analysis.keywords = cleanMessage.toLowerCase().split(' ').filter(word => 
        word.length > 3 && 
        !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'].includes(word)
      );
      
      return {
        success: true,
        analysis: analysis
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async generateIntelligentResponse(messageText, context = '') {
    try {
      const analysis = await this.analyzeMessageIntent(messageText, context);
      
      if (!analysis.success) {
        return this.getRandomResponse('general');
      }
      
      const { intent, urgency, category, cleanMessage } = analysis.analysis;
      
      // Generate contextual response based on analysis
      let response = '';
      
      if (category === 'greeting') {
        response = this.getRandomResponse('greeting');
      } else if (category === 'technical') {
        response = this.getRandomResponse('technical');
        response += `\n\nRegarding "${cleanMessage}", I'd be happy to help with technical details. Could you provide more specific information about what you're working on?`;
      } else if (category === 'urgent') {
        response = this.getRandomResponse('urgent');
        response += `\n\nI understand this is urgent. Let me help you with "${cleanMessage}". What specific assistance do you need right now?`;
      } else if (intent === 'question') {
        response = this.getRandomResponse('general');
        response += `\n\nGreat question! "${cleanMessage}" - Let me think about that and provide you with a helpful response.`;
      } else {
        response = this.getRandomResponse('general');
        response += `\n\nI see you mentioned: "${cleanMessage}". How can I assist you with this?`;
      }
      
      // Add signature
      response += `\n\n${this.autoReplyConfig.signature}`;
      
      return response;
    } catch (error) {
      return `Hello! I received your mention. How can I help you today? ${this.autoReplyConfig.signature}`;
    }
  }
  
  getRandomResponse(category) {
    const responses = this.responseTemplates[category] || this.responseTemplates.general;
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  async checkIntelligentMentions(channel, limit) {
    try {
      if (!this.autoReplyConfig.enabled) {
        return {
          success: true,
          message: 'Intelligent auto-reply is disabled. Use setup_intelligent_auto_reply to enable it.',
          mentions_found: 0
        };
      }
      
      // Get recent messages from the channel
      const messages = await this.getChannelMessages(channel, limit);
      
      if (!messages.success) {
        return messages;
      }
      
      let mentionsFound = 0;
      const now = Date.now();
      
      for (const message of messages.messages) {
        // Check if message mentions the target user OR any of the agent names
        const mentionsUser = message.text && message.text.includes(`<@${this.autoReplyConfig.targetUserId}>`);
        const mentionsAgent = message.text && this.autoReplyConfig.agentNames.some(agentName => 
          message.text.toLowerCase().includes(agentName.toLowerCase())
        );
        
        if (mentionsUser || mentionsAgent) {
          // Check cooldown
          const lastReplyTime = this.autoReplyConfig.lastReplyTime.get(message.user) || 0;
          const cooldownMs = this.autoReplyConfig.cooldownMinutes * 60 * 1000;
          
          if (now - lastReplyTime > cooldownMs) {
            // Generate intelligent response
            let replyMessage;
            if (this.autoReplyConfig.intelligentMode) {
              replyMessage = await this.generateIntelligentResponse(message.text);
            } else {
              replyMessage = `Hello! I received your mention. How can I help you today? ${this.autoReplyConfig.signature}`;
            }
            
            // Send intelligent auto-reply
            const replyResult = await this.replyToMessage(
              channel,
              message.timestamp,
              replyMessage
            );
            
            if (replyResult.success) {
              this.autoReplyConfig.lastReplyTime.set(message.user, now);
              mentionsFound++;
              
              console.log(`🤖 Intelligent auto-reply sent to user ${message.user}`);
              console.log(`📝 Response: ${replyMessage.substring(0, 100)}...`);
            }
          }
        }
      }
      
      return {
        success: true,
        channel,
        mentions_found: mentionsFound,
        messages_checked: messages.messages.length,
        intelligent_mode: this.autoReplyConfig.intelligentMode,
        auto_reply_enabled: this.autoReplyConfig.enabled
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getIntelligentAutoReplyStatus() {
    try {
      return {
        success: true,
        config: {
          enabled: this.autoReplyConfig.enabled,
          intelligentMode: this.autoReplyConfig.intelligentMode,
          personality: this.autoReplyConfig.personality,
          signature: this.autoReplyConfig.signature,
          targetChannel: this.autoReplyConfig.targetChannel,
          targetUserId: this.autoReplyConfig.targetUserId,
          cooldownMinutes: this.autoReplyConfig.cooldownMinutes,
          lastReplyTimes: Object.fromEntries(this.autoReplyConfig.lastReplyTime)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Tool implementations (keeping all existing methods)
  async sendMessage(channel, text, blocks = null) {
    try {
      const response = await this.client.chat.postMessage({
        channel,
        text,
        blocks
      });
      
      return {
        success: true,
        channel,
        message: text,
        timestamp: response.ts,
        message_url: `https://slack.com/archives/${channel}/p${response.ts.replace('.', '')}`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async sendDirectMessage(userId, text) {
    try {
      // Open DM channel
      const dmResponse = await this.client.conversations.open({
        users: userId
      });
      const channelId = dmResponse.channel.id;
      
      // Send message
      const response = await this.client.chat.postMessage({
        channel: channelId,
        text
      });
      
      return {
        success: true,
        user_id: userId,
        channel_id: channelId,
        message: text,
        timestamp: response.ts
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async replyToMessage(channel, threadTs, text) {
    try {
      const response = await this.client.chat.postMessage({
        channel,
        thread_ts: threadTs,
        text
      });
      
      return {
        success: true,
        channel,
        thread_ts: threadTs,
        reply_ts: response.ts,
        message: text
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async addReaction(channel, timestamp, emoji) {
    try {
      const response = await this.client.reactions.add({
        channel,
        timestamp,
        name: emoji
      });
      
      return {
        success: true,
        channel,
        timestamp,
        emoji,
        added: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getChannelMessages(channel, limit) {
    try {
      const response = await this.client.conversations.history({
        channel,
        limit
      });
      
      const messages = response.messages.map(message => ({
        timestamp: message.ts,
        text: message.text || '',
        user: message.user,
        bot_id: message.bot_id,
        thread_ts: message.thread_ts,
        reactions: message.reactions || []
      }));
      
      return {
        success: true,
        channel,
        messages,
        count: messages.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getUserInfo(userId) {
    try {
      const response = await this.client.users.info({ user: userId });
      const user = response.user;
      
      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          real_name: user.real_name,
          display_name: user.profile.display_name,
          email: user.profile.email,
          title: user.profile.title,
          image_48: user.profile.image_48,
          is_bot: user.is_bot
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async listChannels(types = 'public_channel,private_channel') {
    try {
      const response = await this.client.conversations.list({ types });
      
      const channels = response.channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        is_archived: channel.is_archived,
        member_count: channel.num_members,
        topic: channel.topic.value,
        purpose: channel.purpose.value
      }));
      
      return {
        success: true,
        channels,
        count: channels.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async createChannel(name, isPrivate = false) {
    try {
      const response = await this.client.conversations.create({
        name,
        is_private: isPrivate
      });
      
      return {
        success: true,
        channel: {
          id: response.channel.id,
          name: response.channel.name,
          is_private: response.channel.is_private
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async joinChannel(channel) {
    try {
      const response = await this.client.conversations.join({ channel });
      
      return {
        success: true,
        channel,
        joined: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async sendFile(channel, filePath, title = null, initialComment = null) {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Get filename from file path
      const filename = path.basename(filePath);
      
      // Resolve channel name to ID if needed
      let channelId = channel;
      if (channel.startsWith('#')) {
        const channelName = channel.substring(1);
        try {
          const channelInfo = await this.client.conversations.list({
            types: 'public_channel,private_channel'
          });
          const foundChannel = channelInfo.channels.find(c => c.name === channelName);
          if (foundChannel) {
            channelId = foundChannel.id;
          }
        } catch (err) {
          console.log('Could not resolve channel name, using as-is:', channel);
        }
      }
      
      console.log(`📤 Uploading file ${filename} to channel ${channelId}`);
      
      // Use the newer uploadV2 method
      const response = await this.client.files.uploadV2({
        channel_id: channelId,
        file: fs.createReadStream(filePath),
        filename: filename,
        title: title || filename,
        initial_comment: initialComment
      });
      
      console.log('📤 File upload response:', response);
      
      return {
        success: true,
        channel: channelId,
        file_path: filePath,
        file_id: response.file.id,
        file_url: response.file.url_private
      };
    } catch (error) {
      console.error('❌ File upload error:', error);
      return { success: false, error: error.message };
    }
  }
  
  async pinMessage(channel, timestamp) {
    try {
      const response = await this.client.pins.add({
        channel,
        timestamp
      });
      
      return {
        success: true,
        channel,
        timestamp,
        pinned: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async searchMessages(query, count) {
    try {
      const response = await this.client.search.messages({
        query,
        count
      });
      
      const messages = response.messages.matches.map(match => ({
        text: match.text,
        user: match.user,
        channel: match.channel.name,
        timestamp: match.ts,
        permalink: match.permalink
      }));
      
      return {
        success: true,
        query,
        messages,
        count: messages.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Resource implementations
  async getWorkspaceInfo() {
    try {
      const response = await this.client.team.info();
      const team = response.team;
      
      return {
        id: team.id,
        name: team.name,
        domain: team.domain,
        email_domain: team.email_domain,
        icon: team.icon
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  async getChannelList() {
    try {
      const response = await this.client.conversations.list();
      const channels = response.channels.map(channel => ({
        id: channel.id,
        name: channel.name,
        is_private: channel.is_private,
        member_count: channel.num_members
      }));
      return { channels };
    } catch (error) {
      return { error: error.message };
    }
  }
  
  async getUserList() {
    try {
      const response = await this.client.users.list();
      const users = response.members.map(user => ({
        id: user.id,
        name: user.name,
        real_name: user.real_name,
        is_bot: user.is_bot
      }));
      return { users };
    } catch (error) {
      return { error: error.message };
    }
  }

  // Additional tool implementations (keeping all existing methods)
  async editMessage(channel, timestamp, text, blocks = null) {
    try {
      const response = await this.client.chat.update({
        channel,
        ts: timestamp,
        text,
        blocks
      });
      
      return {
        success: true,
        channel,
        timestamp,
        text,
        updated: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async deleteMessage(channel, timestamp) {
    try {
      const response = await this.client.chat.delete({
        channel,
        ts: timestamp
      });
      
      return {
        success: true,
        channel,
        timestamp,
        deleted: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getMessagePermalink(channel, timestamp) {
    try {
      const response = await this.client.chat.getPermalink({
        channel,
        message_ts: timestamp
      });
      
      return {
        success: true,
        channel,
        timestamp,
        permalink: response.permalink
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async removeReaction(channel, timestamp, emoji) {
    try {
      const response = await this.client.reactions.remove({
        channel,
        timestamp,
        name: emoji
      });
      
      return {
        success: true,
        channel,
        timestamp,
        emoji,
        removed: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getMessageReactions(channel, timestamp) {
    try {
      const response = await this.client.reactions.get({
        channel,
        timestamp
      });
      
      const reactions = response.message.reactions || [];
      
      return {
        success: true,
        channel,
        timestamp,
        reactions: reactions.map(reaction => ({
          name: reaction.name,
          count: reaction.count,
          users: reaction.users
        }))
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async archiveChannel(channel) {
    try {
      const response = await this.client.conversations.archive({
        channel
      });
      
      return {
        success: true,
        channel,
        archived: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async unarchiveChannel(channel) {
    try {
      const response = await this.client.conversations.unarchive({
        channel
      });
      
      return {
        success: true,
        channel,
        unarchived: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async renameChannel(channel, name) {
    try {
      const response = await this.client.conversations.rename({
        channel,
        name
      });
      
      return {
        success: true,
        channel,
        new_name: name,
        renamed: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async setChannelTopic(channel, topic) {
    try {
      const response = await this.client.conversations.setTopic({
        channel,
        topic
      });
      
      return {
        success: true,
        channel,
        topic,
        updated: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async setChannelPurpose(channel, purpose) {
    try {
      const response = await this.client.conversations.setPurpose({
        channel,
        purpose
      });
      
      return {
        success: true,
        channel,
        purpose,
        updated: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async inviteToChannel(channel, users) {
    try {
      const userList = users.split(',').map(user => user.trim());
      const response = await this.client.conversations.invite({
        channel,
        users: userList.join(',')
      });
      
      return {
        success: true,
        channel,
        users: userList,
        invited: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async kickFromChannel(channel, user) {
    try {
      const response = await this.client.conversations.kick({
        channel,
        user
      });
      
      return {
        success: true,
        channel,
        user,
        kicked: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async deleteFile(fileId) {
    try {
      const response = await this.client.files.delete({
        file: fileId
      });
      
      return {
        success: true,
        file_id: fileId,
        deleted: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getFileInfo(fileId) {
    try {
      const response = await this.client.files.info({
        file: fileId
      });
      
      const file = response.file;
      return {
        success: true,
        file: {
          id: file.id,
          name: file.name,
          title: file.title,
          user: file.user,
          size: file.size,
          url_private: file.url_private,
          url_private_download: file.url_private_download,
          mimetype: file.mimetype,
          filetype: file.filetype,
          created: file.created,
          timestamp: file.timestamp
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async listFiles(user = null, channel = null, limit = 20) {
    try {
      const params = { count: limit };
      if (user) params.user = user;
      if (channel) params.channel = channel;
      
      const response = await this.client.files.list(params);
      
      const files = response.files.map(file => ({
        id: file.id,
        name: file.name,
        title: file.title,
        user: file.user,
        size: file.size,
        url_private: file.url_private,
        mimetype: file.mimetype,
        filetype: file.filetype,
        created: file.created
      }));
      
      return {
        success: true,
        files,
        count: files.length
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getUserPresence(userId) {
    try {
      const response = await this.client.users.getPresence({
        user: userId
      });
      
      return {
        success: true,
        user_id: userId,
        presence: response.presence,
        online: response.presence === 'active',
        last_activity: response.last_activity
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async setUserPresence(presence) {
    try {
      const response = await this.client.users.setPresence({
        presence
      });
      
      return {
        success: true,
        presence,
        updated: response.ok
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async scheduleMessage(channel, text, postAt, blocks = null) {
    try {
      const response = await this.client.chat.scheduleMessage({
        channel,
        text,
        post_at: postAt,
        blocks
      });
      
      return {
        success: true,
        channel,
        text,
        post_at: postAt,
        scheduled_message_id: response.scheduled_message_id
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async getConversationInfo(channel) {
    try {
      const response = await this.client.conversations.info({
        channel
      });
      
      const conv = response.channel;
      return {
        success: true,
        channel: {
          id: conv.id,
          name: conv.name,
          is_private: conv.is_private,
          is_archived: conv.is_archived,
          is_general: conv.is_general,
          created: conv.created,
          creator: conv.creator,
          num_members: conv.num_members,
          topic: conv.topic.value,
          purpose: conv.purpose.value,
          is_member: conv.is_member,
          is_open: conv.is_open
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Quick message helper function
  async quickMessage(message, recipient = '#general', type = 'channel') {
    console.log('▓▒░ Cipher Agent002 Quick Message ⟨MATRIX⟩');
    console.log(`📤 Sending "${message}" to ${recipient} (${type})`);
    
    try {
      let result;
      
      if (type === 'dm') {
        result = await this.sendDirectMessage(recipient, message);
      } else {
        result = await this.sendMessage(recipient, message);
      }
      
      if (result.success) {
        console.log('✅ Message sent successfully!');
        console.log(`   Timestamp: ${result.timestamp}`);
        if (result.message_url) {
          console.log(`   URL: ${result.message_url}`);
        }
        return result;
      } else {
        console.log('❌ Failed to send message:', result.error);
        return result;
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('▓▒░ Cipher Agent002 Intelligent Slack MCP Server running... ⟨MATRIX⟩');
  }
}

// Main execution
async function main() {
  try {
    const server = new IntelligentSlackMCPServer();
    await server.run();
  } catch (error) {
    console.error('Error starting server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = IntelligentSlackMCPServer;

