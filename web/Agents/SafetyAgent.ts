// web/Agents/SafetyAgent.ts
// Checks construction notes for potential safety issues.
// Does not store state or handle persistence.

import OpenAI from 'openai'
import { ShieldAlert } from 'lucide-react'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const SafetyIcon = ShieldAlert

export async function checkSafety(text: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: 'Identify any safety concerns in the user note.' },
      { role: 'user', content: text }
    ]
  })

  return completion.choices[0]?.message?.content?.trim() || ''
}
