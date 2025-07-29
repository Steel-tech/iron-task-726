import axios from 'axios'

// Mock translation service - in production, use Google Translate API, DeepL, or Azure Translator
export async function translateText(
  text: string, 
  sourceLang: string, 
  targetLang: string
): Promise<string> {
  // For demo purposes, we'll use a simple mock
  // In production, integrate with a real translation API
  
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    return googleTranslate(text, sourceLang, targetLang)
  }
  
  // Mock translations for demo
  return mockTranslate(text, sourceLang, targetLang)
}

async function googleTranslate(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  const url = `https://translation.googleapis.com/language/translate/v2`
  
  try {
    const response = await axios.post(url, {
      q: text,
      source: sourceLang,
      target: targetLang,
      format: 'text',
      key: apiKey
    })
    
    return response.data.data.translations[0].translatedText
  } catch (error) {
    console.error('Google Translate error:', error)
    throw error
  }
}

function mockTranslate(
  text: string,
  sourceLang: string,
  targetLang: string
): string {
  // Simple mock translations for demo
  const translations: Record<string, Record<string, Record<string, string>>> = {
    en: {
      es: {
        'Safety issue here': 'Problema de seguridad aquí',
        'Check the welding': 'Revisar la soldadura',
        'Looks good': 'Se ve bien',
        'Need inspection': 'Necesita inspección',
        '@': '@'
      },
      fr: {
        'Safety issue here': 'Problème de sécurité ici',
        'Check the welding': 'Vérifier la soudure',
        'Looks good': 'Ça a l\'air bien',
        'Need inspection': 'Besoin d\'inspection',
        '@': '@'
      },
      de: {
        'Safety issue here': 'Sicherheitsproblem hier',
        'Check the welding': 'Schweißnaht prüfen',
        'Looks good': 'Sieht gut aus',
        'Need inspection': 'Inspektion erforderlich',
        '@': '@'
      },
      pt: {
        'Safety issue here': 'Problema de segurança aqui',
        'Check the welding': 'Verificar a soldagem',
        'Looks good': 'Parece bom',
        'Need inspection': 'Precisa de inspeção',
        '@': '@'
      }
    },
    es: {
      en: {
        'Problema de seguridad aquí': 'Safety issue here',
        'Revisar la soldadura': 'Check the welding',
        'Se ve bien': 'Looks good',
        'Necesita inspección': 'Need inspection',
        '@': '@'
      }
    },
    fr: {
      en: {
        'Problème de sécurité ici': 'Safety issue here',
        'Vérifier la soudure': 'Check the welding',
        'Ça a l\'air bien': 'Looks good',
        'Besoin d\'inspection': 'Need inspection',
        '@': '@'
      }
    }
  }
  
  // Try to find translation
  if (translations[sourceLang]?.[targetLang]?.[text]) {
    return translations[sourceLang][targetLang][text]
  }
  
  // For demo, add language prefix to show translation is happening
  const langPrefixes: Record<string, string> = {
    es: '[ES]',
    fr: '[FR]',
    de: '[DE]',
    pt: '[PT]',
    zh: '[中文]',
    ja: '[日本語]',
    ko: '[한국어]'
  }
  
  const prefix = langPrefixes[targetLang] || `[${targetLang.toUpperCase()}]`
  return `${prefix} ${text}`
}

// Get user's preferred language from browser headers
export function getUserLanguage(acceptLanguageHeader?: string): string {
  if (!acceptLanguageHeader) return 'en'
  
  // Parse Accept-Language header
  const languages = acceptLanguageHeader
    .split(',')
    .map(lang => {
      const [code, q = '1'] = lang.trim().split(';q=')
      return {
        code: code.split('-')[0], // Just the language part, not region
        quality: parseFloat(q)
      }
    })
    .sort((a, b) => b.quality - a.quality)
  
  return languages[0]?.code || 'en'
}