// web/Agents/SummaryAgent.ts
// Defines an OpenAI agent that summarizes text for reports.
// It is not responsible for UI rendering or routing.

import OpenAI from 'openai'
import { BookOpen } from 'lucide-react'

// Initialize OpenAI with API key from environment
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const SummaryIcon = BookOpen

// Summarize text using GPT model
export async function summarize(text: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [{ role: 'user', content: `Summarize the following:\n${text}` }]
  })

  return completion.choices[0]?.message?.content?.trim() || ''
}
