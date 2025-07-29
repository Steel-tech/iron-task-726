// web/Agents/ProgressAgent.ts
// Generates a concise progress update from field notes.
// Pure utility; it leaves rendering to the caller.

import OpenAI from 'openai'
import { TrendingUp } from 'lucide-react'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const ProgressIcon = TrendingUp

export async function progressUpdate(text: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: 'Summarize this construction progress update.' },
      { role: 'user', content: text }
    ]
  })

  return completion.choices[0]?.message?.content?.trim() || ''
}
