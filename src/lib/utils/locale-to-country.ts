/**
 * Extracts ISO 3166-1 alpha-2 country code from a BCP-47 locale string.
 * Returns null when the locale has no region component.
 *
 * Used to derive `reviewer_country` from the Play Store `reviewerLanguage`
 * field at ingest time. Region must be exactly 2 uppercase letters; bare
 * language codes ("en", "hi") and malformed casing ("EN_us") return null.
 *
 * @example
 *   extractCountryFromLocale("en_US")  // "US"
 *   extractCountryFromLocale("en-GB")  // "GB"
 *   extractCountryFromLocale("pt_BR")  // "BR"
 *   extractCountryFromLocale("hi_IN")  // "IN"
 *   extractCountryFromLocale("fil_PH") // "PH" (3-letter language)
 *   extractCountryFromLocale("en")     // null
 *   extractCountryFromLocale("")       // null
 *   extractCountryFromLocale(null)     // null
 *   extractCountryFromLocale(undefined)// null
 *   extractCountryFromLocale("EN_us")  // null (wrong casing)
 */
export function extractCountryFromLocale(locale: string | null | undefined): string | null {
  if (!locale || typeof locale !== "string") return null;
  const match = locale.trim().match(/^[a-z]{2,3}[_-]([A-Z]{2})$/);
  return match ? match[1] : null;
}
