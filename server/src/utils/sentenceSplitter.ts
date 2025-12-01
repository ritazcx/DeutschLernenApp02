/**
 * German-aware sentence splitting utility
 * Handles abbreviations, dates, ordinal numbers, and other German-specific patterns
 */

/**
 * Split German text into sentences while preserving dates and abbreviations
 * @param text - The German text to split
 * @returns Array of sentences
 */
export function splitIntoSentences(text: string): string[] {
  // Common German abbreviations that shouldn't trigger sentence breaks
  const abbreviations = [
    'z.B.', 'z. B.', 'd.h.', 'd. h.', 'usw.', 'bzw.', 'etc.', 'evtl.', 'ggf.', 'inkl.', 'ca.',
    'Dr.', 'Prof.', 'Hr.', 'Fr.', 'Str.', 'Nr.', 'Bd.', 'vgl.', 'S.', 'Tel.', 'Fax'
  ];

  // Month names in German for date detection
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  let processedText = text;
  const protectedPatterns: { placeholder: string; original: string }[] = [];
  let placeholderIndex = 0;

  // Protect abbreviations
  abbreviations.forEach(abbr => {
    const regex = new RegExp(abbr.replace(/\./g, '\\.'), 'g');
    processedText = processedText.replace(regex, (match) => {
      const placeholder = `__ABBR_${placeholderIndex}__`;
      protectedPatterns.push({ placeholder, original: match });
      placeholderIndex++;
      return placeholder;
    });
  });

  // Protect date patterns like "13. September 2007" or "5. und 21. August 2016"
  months.forEach(month => {
    // Pattern: digit(s) + period + space + month
    const datePattern = new RegExp(`(\\d+)\\. (${month})`, 'g');
    processedText = processedText.replace(datePattern, (match) => {
      const placeholder = `__DATE_${placeholderIndex}__`;
      protectedPatterns.push({ placeholder, original: match });
      placeholderIndex++;
      return placeholder;
    });

    // Pattern: "5. und 21. August" - two dates with "und"
    const doubleDatePattern = new RegExp(`(\\d+)\\. und (\\d+)\\. (${month})`, 'g');
    processedText = processedText.replace(doubleDatePattern, (match) => {
      const placeholder = `__DDATE_${placeholderIndex}__`;
      protectedPatterns.push({ placeholder, original: match });
      placeholderIndex++;
      return placeholder;
    });
  });

  // Protect ordinal numbers at start of sentences (e.g., "1. Das ist...", "2. Man muss...")
  processedText = processedText.replace(/(\n|^)(\d+)\. /g, (match, linebreak, num) => {
    const placeholder = `${linebreak}__ORD_${placeholderIndex}__ `;
    protectedPatterns.push({ placeholder: `__ORD_${placeholderIndex}__`, original: `${num}.` });
    placeholderIndex++;
    return placeholder;
  });

  // Protect Roman numerals followed by period (e.g., "XXXI.", "IV.", "XII.")
  processedText = processedText.replace(/\b([IVXLCDM]+)\./g, (match, roman) => {
    const placeholder = `__ROMAN_${placeholderIndex}__`;
    protectedPatterns.push({ placeholder, original: match });
    placeholderIndex++;
    return placeholder;
  });

  // Split by line breaks first
  const lines = processedText.split(/\n|\r\n/).filter((line: string) => line.trim().length > 0);
  const sentences: string[] = [];

  lines.forEach((line: string) => {
    // Split on sentence-ending punctuation followed by space and capital letter
    // Use lookahead to keep the punctuation with the sentence
    const parts = line.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/);

    parts.forEach(part => {
      const trimmed = part.trim();
      if (trimmed.length > 0) {
        sentences.push(trimmed);
      }
    });
  });

  // Restore protected patterns
  return sentences.map(sentence => {
    let restored = sentence;
    protectedPatterns.forEach(({ placeholder, original }) => {
      restored = restored.replace(placeholder, original);
    });
    return restored;
  });
}
