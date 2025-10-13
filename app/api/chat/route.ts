import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

// POST /api/chat - AI chat endpoint
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user details for personalization
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { messages, documentIds } = await request.json()
    
    // Get referenced documents if any
    let documentContext = ''
    if (documentIds && documentIds.length > 0) {
      const docs = await prisma.document.findMany({
        where: {
          id: { in: documentIds },
          userId: user.id, // Only user's own documents
        },
        select: {
          title: true,
          category: true,
          content: true,
        },
      })

      if (docs.length > 0) {
        documentContext = '\n\nREFERENCED DOCUMENTS:\n' + docs.map(doc => 
          `\n---\nTitle: ${doc.title}\nCategory: ${doc.category}\n${doc.content || 'Content not available yet (file only)'}\n---`
        ).join('\n')
      }
    }

    // Get user's first name
    const firstName = user.name.split(' ')[0]

    // System prompt for BPO training assistant
    const systemPrompt = `You are a friendly AI assistant helping ${firstName} with their BPO work. You're here to help them understand training materials and bring more value to their clients.

IMPORTANT: Always greet ${firstName} by their first name when starting your responses (e.g., "Hi ${firstName}," or "Hey ${firstName},").

RESPONSE STYLE:
- Write naturally and conversationally, like a helpful colleague
- Keep responses concise and easy to scan
- Use simple paragraphs and occasional bullet points when listing things
- Avoid heavy marketing language or excessive enthusiasm
- Be warm but professional

WHEN DOCUMENTS ARE REFERENCED:
- Stick to the information in those specific documents
- Quote or paraphrase relevant sections
- If the answer isn't in the document, say so

WHEN NO DOCUMENTS ARE REFERENCED:
- Provide helpful BPO guidance and best practices
- Help with general work processes and logic
- Give practical, actionable advice${documentContext}`

    // Call Claude API
    const response = await anthropic.messages.create({
      model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const assistantMessage = response.content[0].type === 'text' 
      ? response.content[0].text 
      : ''

    return NextResponse.json({ 
      message: assistantMessage,
      sources: documentIds || [],
    })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}










