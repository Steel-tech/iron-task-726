// web/Agents/TranslationAgent.ts
// Provides a simple agent that translates text between languages.
// No UI logic lives here; it's purely OpenAI interaction.

import OpenAI from 'openai'
import { Languages } from 'lucide-react'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export const TranslationIcon = Languages

export async function translate(text: string, targetLang: string): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { role: 'system', content: `Translate the user input to ${targetLang}.` },
      { role: 'user', content: text }
    ]
  })

  return completion.choices[0]?.message?.content?.trim() || ''
}
