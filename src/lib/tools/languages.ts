export type LanguageOption = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  group: "indian" | "global";
};

export const LANGUAGES: LanguageOption[] = [
  // Indian
  { code: "en", name: "English", nativeName: "English", flag: "🇮🇳", group: "indian" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", group: "indian" },
  { code: "hinglish", name: "Hinglish", nativeName: "Roman script", flag: "🇮🇳", group: "indian" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳", group: "indian" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳", group: "indian" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳", group: "indian" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳", group: "indian" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳", group: "indian" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳", group: "indian" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳", group: "indian" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳", group: "indian" },
  // Global
  { code: "en-US", name: "English (US)", nativeName: "English", flag: "🇺🇸", group: "global" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", group: "global" },
  { code: "pt-BR", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", group: "global" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa", flag: "🇮🇩", group: "global" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt", flag: "🇻🇳", group: "global" },
  { code: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭", group: "global" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", group: "global" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", group: "global" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵", group: "global" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", group: "global" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷", group: "global" },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", group: "global" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷", group: "global" },
  { code: "zh-CN", name: "Chinese", nativeName: "简体中文", flag: "🇨🇳", group: "global" },
];

export const LANGUAGE_BY_CODE: Record<string, LanguageOption> = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, l])
);

// Per-language hints baked into the translate prompt for unusual scripts/registers.
export const LANGUAGE_PROMPT_NOTES: Record<string, string> = {
  hinglish: "Roman script, natural Hindi-English code-mixing as used by Indian smartphone users.",
  ar: "Modern Standard Arabic. Output in RTL script as standard.",
  "zh-CN": "Simplified Chinese characters.",
  "pt-BR": "Brazilian Portuguese.",
  "en-US": "US English spelling and idioms.",
};
