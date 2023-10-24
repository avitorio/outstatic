import { OpenAIStream, StreamingTextResponse } from 'ai'
import OpenAI from 'openai'

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
})

export const runtime = 'edge'

export default async function POST(req: Request): Promise<Response> {
  let { prompt } = await req.json()

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content:
          'You are an AI writing assistant that autocompletes existing text based on context from prior text. ' +
          'Give more weight/priority to the later characters than the beginning ones.' +
          'If the context asks for code, return markdown code blocks.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    n: 1
  })

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)

  // Respond with the stream
  return new StreamingTextResponse(stream)
}
