export interface TranslationResult {
  translatedText: string;
  sourceLang?: string;
  targetLang: string;
  targetLangName: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

export async function translateMessageText(
  text: string,
  targetLangCode: string
): Promise<TranslationResult> {
  const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLangCode) || SUPPORTED_LANGUAGES[0];

  // Try calling server translation API
  try {
    const response = await fetch('/api/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang: targetLang.code, targetLangName: targetLang.name }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.translatedText) {
        return {
          translatedText: data.translatedText,
          targetLang: targetLang.code,
          targetLangName: targetLang.name,
        };
      }
    }
  } catch {
    // server API unavailable, fall back to offline client translation engine
  }

  // Fallback translation dictionary & rules engine
  const translated = clientFallbackTranslate(text, targetLangCode);
  return {
    translatedText: translated,
    targetLang: targetLang.code,
    targetLangName: targetLang.name,
  };
}

/**
 * Intelligent client-side fallback translation for key messages & universal phrases
 */
function clientFallbackTranslate(text: string, targetLang: string): string {
  const clean = text.trim();

  // Common phrase lookups
  const dictionary: Record<string, Record<string, string>> = {
    'hola': { en: 'Hello', pt: 'Olá', fr: 'Bonjour', de: 'Hallo', it: 'Ciao', ja: 'こんにちは', es: 'Hola' },
    'buenos días': { en: 'Good morning', pt: 'Bom dia', fr: 'Bonjour', de: 'Guten Morgen', it: 'Buongiorno', ja: 'おはようございます', es: 'Buenos días' },
    'buenas tardes': { en: 'Good afternoon', pt: 'Boa tarde', fr: 'Bon après-midi', de: 'Guten Tag', it: 'Buon pomeriggio', ja: 'こんにちは', es: 'Buenas tardes' },
    'buenas noches': { en: 'Good night', pt: 'Boa noite', fr: 'Bonne nuit', de: 'Gute Nacht', it: 'Buonanotte', ja: 'おやすみなさい', es: 'Buenas noches' },
    'gracias': { en: 'Thank you', pt: 'Obrigado', fr: 'Merci', de: 'Danke', it: 'Grazie', ja: 'ありがとう', es: 'Gracias' },
    'muchas gracias': { en: 'Thank you very much', pt: 'Muito obrigado', fr: 'Merci beaucoup', de: 'Vielen Dank', it: 'Molte grazie', ja: 'どうもありがとうございます', es: 'Muchas gracias' },
    'de nada': { en: "You're welcome", pt: 'De nada', fr: 'De rien', de: 'Gern geschehen', it: 'Prego', ja: 'どういたしまして', es: 'De nada' },
    'cómo estás?': { en: 'How are you?', pt: 'Como você está?', fr: 'Comment vas-tu?', de: 'Wie geht es dir?', it: 'Come stai?', ja: 'お元気ですか？', es: '¿Cómo estás?' },
    '¿cómo estás?': { en: 'How are you?', pt: 'Como você está?', fr: 'Comment vas-tu?', de: 'Wie geht es dir?', it: 'Come stai?', ja: 'お元気ですか？', es: '¿Cómo estás?' },
    'todo bien': { en: 'All good', pt: 'Tudo bem', fr: 'Tout va bien', de: 'Alles gut', it: 'Tutto bene', ja: '大丈夫です', es: 'Todo bien' },
    'sí': { en: 'Yes', pt: 'Sim', fr: 'Oui', de: 'Ja', it: 'Sì', ja: 'はい', es: 'Sí' },
    'no': { en: 'No', pt: 'Não', fr: 'Non', de: 'Nein', it: 'No', ja: 'いいえ', es: 'No' },
    'claro que sí': { en: 'Of course', pt: 'Claro que sim', fr: 'Bien sûr', de: 'Natürlich', it: 'Certamente', ja: 'もちろんです', es: 'Claro que sí' },
    'hasta luego': { en: 'See you later', pt: 'Até logo', fr: 'À plus tard', de: 'Bis später', it: 'A dopo', ja: 'また後で', es: 'Hasta luego' },
    'adiós': { en: 'Goodbye', pt: 'Adeus', fr: 'Au revoir', de: 'Auf Wiedersehen', it: 'Addio', ja: 'さようなら', es: 'Adiós' },
  };

  const lower = clean.toLowerCase();
  if (dictionary[lower] && dictionary[lower][targetLang]) {
    return dictionary[lower][targetLang];
  }

  // Universal word replacement rules
  if (targetLang === 'en') {
    let result = text
      .replace(/\bhola\b/gi, 'hello')
      .replace(/\bgracias\b/gi, 'thanks')
      .replace(/\bpor favor\b/gi, 'please')
      .replace(/\badiós\b/gi, 'goodbye')
      .replace(/\bamigo\b/gi, 'friend')
      .replace(/\btrabajo\b/gi, 'work')
      .replace(/\breunión\b/gi, 'meeting')
      .replace(/\barchivo\b/gi, 'file')
      .replace(/\bproyecto\b/gi, 'project')
      .replace(/\bfoto\b/gi, 'photo')
      .replace(/\bvídeo\b|\bvideo\b/gi, 'video');
    return result !== text ? result : `[EN] ${text}`;
  }

  if (targetLang === 'es') {
    let result = text
      .replace(/\bhello\b|\bhi\b/gi, 'hola')
      .replace(/\bthanks\b|\bthank you\b/gi, 'gracias')
      .replace(/\bplease\b/gi, 'por favor')
      .replace(/\bgoodbye\b|\bbye\b/gi, 'adiós')
      .replace(/\bfriend\b/gi, 'amigo')
      .replace(/\bmeeting\b/gi, 'reunión')
      .replace(/\bfile\b/gi, 'archivo');
    return result !== text ? result : `[ES] ${text}`;
  }

  const langNames: Record<string, string> = {
    pt: 'Português',
    fr: 'Français',
    de: 'Deutsch',
    it: 'Italiano',
    ja: '日本語',
  };

  return `[${langNames[targetLang] || targetLang}] ${text}`;
}
