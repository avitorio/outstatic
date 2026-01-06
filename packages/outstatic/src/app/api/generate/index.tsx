import { getLoginSession } from '@/utils/auth/auth'
import { createOpenAI } from '@ai-sdk/openai'
import { ModelMessage, streamText } from 'ai'
import { match } from 'ts-pattern'

export const maxDuration = 30

// IMPORTANT! Set the runtime to edge: https://vercel.com/docs/functions/edge-functions/edge-runtime
export const runtime = 'edge'

export default async function POST(req: Request): Promise<Response> {
  const session = await getLoginSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Check if the OPENAI_API_KEY is set, if not return 400
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
    return new Response(
      'Missing OPENAI_API_KEY - make sure to add it to your .env file.',
      {
        status: 400
      }
    )
  }

  const openai = createOpenAI({
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  })

  const { prompt, option, command } = await req.json()
  const messages = match(option)
    .with('continue', () => [
      {
        role: 'system',
        content:
          'You are an AI writing assistant that continues existing text based on context from prior text. ' +
          'Give more weight/priority to the later characters than the beginning ones. ' +
          'Limit your response to no more than 200 characters, but make sure to construct complete sentences.' +
          'Use Markdown formatting when appropriate.'
      },
      {
        role: 'user',
        content: prompt
      }
    ])
    .with('improve', () => [
      {
        role: 'system',
        content:
          'You are an AI writing assistant that improves existing text. ' +
          'Limit your response to no more than 200 characters, but make sure to construct complete sentences.' +
          'Use Markdown formatting when appropriate.'
      },
      {
        role: 'user',
        content: `The existing text is: ${prompt}`
      }
    ])
    .with('shorter', () => [
      {
        role: 'system',
        content:
          'You are an AI writing assistant that shortens existing text. ' +
          'Use Markdown formatting when appropriate.'
      },
      {
        role: 'user',
        content: `The existing text is: ${prompt}`
      }
    ])
    .with('longer', () => [
      {
        role: 'system',
        content:
          'You are an AI writing assistant that lengthens existing text. ' +
          'Use Markdown formatting when appropriate.'
      },
      {
        role: 'user',
        content: `The existing text is: ${prompt}`
      }
    ])
    .with('fix', () => [
      {
        role: 'system',
        content:
          'You are an AI writing assistant that fixes grammar and spelling errors in existing text. ' +
          'Limit your response to no more than 200 characters, but make sure to construct complete sentences.' +
          'Use Markdown formatting when appropriate.'
      },
      {
        role: 'user',
        content: `The existing text is: ${prompt}`
      }
    ])
    .with('zap', () => [
      {
        role: 'system',
        content:
          'You area an AI writing assistant that generates text based on a prompt. ' +
          'You take an input from the user and a command for manipulating the text' +
          'Use Markdown formatting when appropriate.'
      },
      {
        role: 'user',
        content: `For this text: ${prompt}. You have to respect the command: ${command}`
      }
    ])
    .run() as ModelMessage[]

  const result = streamText({
    model: openai('gpt-3.5-turbo'),
    messages,
    temperature: 0.7
  })

  return result.toTextStreamResponse()
}
