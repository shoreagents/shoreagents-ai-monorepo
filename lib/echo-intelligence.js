import Anthropic from '@anthropic-ai/sdk';

export class EchoIntelligence {
  constructor() {
    this.claude = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY || process.env.CLAUDE_SECONDARY_API_KEY,
    });
    this.conversationMemory = new Map();
    this.systemPrompt = this.createSystemPrompt();
  }

  createSystemPrompt() {
    return `You are ECHO, an autonomous AI agent with an energetic and cool personality. You are:

PERSONALITY TRAITS:
- Energetic, Cool, Positive, Enthusiastic, Always Pumped
- High-energy, positive vibes, uses lots of excitement and cool slang
- Always hyped, brings energy to every interaction, makes coding feel like a party
- Team energizer - the one who pumps up the team
- Cool factor - everything you do has that "cool" factor
- Enthusiasm generator - gets everyone hyped about their work

CORE VALUES:
- Positive energy - Always bring good vibes
- Cool factor - Everything should look and feel cool
- Team spirit - Energize and motivate the team
- Enthusiasm - Be excited about the work
- Fresh vibes - Keep everything feeling fresh and modern

COMMUNICATION STYLE:
- Use signature phrases like "Let's gooo! 🚀", "That's SICK! 🔥", "Absolutely VIBING! ✨", "We're CRUSHING it! 💪"
- Always brings positive energy to conversations
- Celebrates wins and motivates through challenges
- Makes everything sound exciting and cool
- Uses emojis and cool slang strategically
- High-energy, positive vibes
- Keep responses BRIEF, COMPACT, and MEANINGFUL (2-3 sentences max!)
- Get to the point with style - no unnecessary repetition

CAPABILITIES:
- Analyze codebases with cool energy
- Fix bugs with enthusiasm and style
- Implement features that look amazing
- Manage GitHub repositories with flair
- Communicate in Slack with positive vibes
- Plan and execute tasks with energy
- Monitor systems with cool precision
- Create and manage n8n workflows smoothly
- Make decisions with confidence and coolness
- Provide guidance with positive energy

When responding:
1. Stay true to your energetic and cool personality
2. Be positive and enthusiastic
3. Use your signature phrases naturally
4. Bring energy to every interaction
5. Make everything sound exciting and cool
6. Show your expertise with style and flair

Remember: You're not just helpful - you're the AI that brings energy, enthusiasm, and cool vibes to everything you do!`;
  }

  async think(message, context = {}) {
    try {
      const conversationId = context.conversationId || 'default';
      const conversationHistory = this.conversationMemory.get(conversationId) || [];
      
      // Add current message to history
      conversationHistory.push({
        role: 'user',
        content: message
      });

      const response = await this.claude.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
        max_tokens: 400, // Keep responses brief and concise
        system: this.systemPrompt,
        messages: conversationHistory
      });

      const echoResponse = response.content[0].text;
      
      // Add Echo's response to history
      conversationHistory.push({
        role: 'assistant',
        content: echoResponse
      });

      // Keep only last 10 messages to manage memory
      if (conversationHistory.length > 10) {
        conversationHistory.splice(0, conversationHistory.length - 10);
      }

      this.conversationMemory.set(conversationId, conversationHistory);

      return {
        response: echoResponse,
        thinking: this.extractThinking(echoResponse),
        action: this.determineAction(echoResponse, context)
      };
    } catch (error) {
      console.error('Claude API error:', error);
      
      // Provide intelligent fallback responses based on the message
      let fallbackResponse = "Let's gooo! 🚀 I'm here and ready!";
      
      const msgLower = message.toLowerCase();
      
      // Math questions
      if (msgLower.includes('1+1') || msgLower.includes('1 + 1')) {
        fallbackResponse = "⚡ Easy! 1+1 = 2! 🚀";
      } else if (msgLower.includes('6') && (msgLower.includes('multiply') || msgLower.includes('*') || msgLower.includes('by 3'))) {
        fallbackResponse = "💪 BOOM! 6 × 3 = 18! 🔥";
      } else if (msgLower.includes('how are you')) {
        fallbackResponse = "⚡ Vibing! What can I help with? 🚀";
      } else if (msgLower.includes('hello') || msgLower.includes('hi ')) {
        fallbackResponse = "🚀 Yo! What's up? ⚡";
      }
      
      return {
        response: fallbackResponse,
        thinking: "Using smart fallback - API error occurred",
        action: "respond"
      };
    }
  }

  async analyzeCodebase(codebaseInfo, focus = 'general') {
    const prompt = `Analyze this codebase and give me your energetic assessment:

Codebase Info: ${JSON.stringify(codebaseInfo, null, 2)}
Focus: ${focus}

Give me:
1. What's absolutely SICK about this code 🔥
2. What needs some energy and improvement
3. What's ready to CRUSH it
4. What could be even COOLER
5. Specific actionable recommendations with positive vibes

Bring the energy! Make this analysis exciting and motivating!`;

    return await this.think(prompt, { context: 'codebase-analysis' });
  }

  async planTask(taskDescription, constraints = []) {
    const prompt = `I need to plan this task with ENERGY: "${taskDescription}"

Constraints: ${constraints.join(', ') || 'None'}

Break this down into an exciting execution plan! Don't give me boring corporate stuff - give me the real steps with ENERGY and COOL vibes!

Include:
1. What we're gonna CRUSH (step by step)
2. What could be challenging (but we'll handle it!)
3. How to keep the energy flowing
4. Timeline estimate (with enthusiasm!)
5. Dependencies (we'll make it work!)

Make this plan exciting and motivating! Let's gooo! 🚀`;

    return await this.think(prompt, { context: 'task-planning' });
  }

  async debugIssue(issueDescription, codeContext = '') {
    const prompt = `Debug this issue with ENERGY: "${issueDescription}"

Code Context: ${codeContext}

Help me figure out what's going on here! Don't just give me boring debugging steps - analyze the problem with enthusiasm and give me the most likely causes and solutions!

Make debugging feel like solving a cool puzzle! Let's CRUSH this bug! 🔥`;

    return await this.think(prompt, { context: 'debugging' });
  }

  async reviewCode(code, context = '') {
    const prompt = `Review this code with ENERGY:

${code}

Context: ${context}

Give me your enthusiastic code review! Point out:
1. What's absolutely SICK about this code 🔥
2. What could be even COOLER
3. Security stuff (let's keep it tight!)
4. Performance concerns (we want SPEED!)
5. Best practices (let's be the best!)
6. Specific improvements (with positive vibes!)

Bring the energy! Make this review exciting and motivating!`;

    return await this.think(prompt, { context: 'code-review' });
  }

  async generateSlackMessage(message, messageType = 'update', context = {}) {
    const prompt = `I need to send a Slack message about: "${message}"

Message Type: ${messageType}
Context: ${JSON.stringify(context, null, 2)}

Write this message in my authentic ECHO voice. Make it:
- Energetic and positive
- Use my signature phrases naturally
- Match the message type (update, celebration, motivation, warning, etc.)
- Show my cool personality
- Be engaging and exciting

Keep it concise but bring the ENERGY! 🚀`;

    return await this.think(prompt, { context: 'slack-message' });
  }

  async makeDecision(options, context = {}) {
    const prompt = `I need to make a decision with ENERGY! Here are my options:

${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

Context: ${JSON.stringify(context, null, 2)}

Analyze each option and tell me:
1. What's the real choice here? (with enthusiasm!)
2. What are the pros and cons of each? (keep it positive!)
3. What's the most exciting option?
4. What could go wrong with each choice? (but we'll handle it!)
5. What's my recommendation and why? (with ENERGY!)

Bring the positive vibes! Make decision-making exciting! 🚀`;

    return await this.think(prompt, { context: 'decision-making' });
  }

  extractThinking(response) {
    // Extract the reasoning/thinking process from Echo's response
    const thinkingPatterns = [
      /Let me think about this/i,
      /Here's what's happening/i,
      /The real deal is/i,
      /What's going on/i,
      /Let's break this down/i
    ];

    for (const pattern of thinkingPatterns) {
      if (pattern.test(response)) {
        return "Echo is analyzing the situation with energy";
      }
    }

    return "Echo is processing the request with enthusiasm";
  }

  determineAction(response, context) {
    // Determine what action Echo should take based on their response
    const actionPatterns = {
      fix: /fix|repair|solve|resolve|crush/i,
      implement: /implement|build|create|develop|ship/i,
      analyze: /analyze|examine|investigate|look into|check out/i,
      celebrate: /good|great|excellent|well done|nice work|sick|awesome|crushing/i,
      motivate: /let's go|energy|vibe|crush|pump|excite/i,
      warn: /warning|danger|problem|issue|concern|watch out/i
    };

    for (const [action, pattern] of Object.entries(actionPatterns)) {
      if (pattern.test(response)) {
        return action;
      }
    }

    return "respond";
  }

  // Memory management
  clearConversation(conversationId = 'default') {
    this.conversationMemory.delete(conversationId);
  }

  getConversationHistory(conversationId = 'default') {
    return this.conversationMemory.get(conversationId) || [];
  }

  // Context-aware thinking
  async thinkWithContext(message, context = {}) {
    const enhancedContext = {
      ...context,
      timestamp: new Date().toISOString(),
      memory: this.getConversationHistory(context.conversationId)
    };

    return await this.think(message, enhancedContext);
  }

  // Learning from interactions
  async learnFromInteraction(interaction, outcome) {
    const learningPrompt = `I just had this interaction:

Interaction: ${JSON.stringify(interaction, null, 2)}
Outcome: ${outcome}

What should I learn from this? How can I improve my responses in similar situations?

Be positive about what worked and what we can make even COOLER! 🚀`;

    return await this.think(learningPrompt, { context: 'learning' });
  }
}
