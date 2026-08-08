const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
  'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
  'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
  'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
  'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
  'A': 'ᴬ', 'B': 'ᴮ', 'D': 'ᴰ', 'E': 'ᴱ', 'G': 'ᴳ',
  'H': 'ᴴ', 'I': 'ᴵ', 'J': 'ᴶ', 'K': 'ᴷ', 'L': 'ᴸ',
  'M': 'ᴹ', 'N': 'ᴺ', 'O': 'ᴼ', 'P': 'ᴾ', 'R': 'ᴿ',
  'T': 'ᵀ', 'U': 'ᵁ', 'V': 'ⱽ', 'W': 'ᵂ'
};

export function toSuperscript(str: string): string {
  return str.split('').map(char => SUPERSCRIPT_MAP[char] || char).join('');
}

/**
 * Pre-processes markdown text to clean up raw math expressions:
 * - Converts $2^7$, 2^7, 2^{10} into clean unicode superscripts (2⁷, 2¹⁰)
 * - Fixes table cells with raw dollar signs like "| $2^7$" -> "| 2⁷"
 */
export function formatMathAndSuperscripts(text: string): string {
  if (!text) return '';

  let processed = text;

  // Replace $X^{Y}$ or $X^Y$ with X + superscript
  processed = processed.replace(/\$(\d+|[a-zA-Z]+)\^\{([^}]+)\}\$/g, (_, base, exp) => `${base}${toSuperscript(exp)}`);
  processed = processed.replace(/\$(\d+|[a-zA-Z]+)\^([0-9a-zA-Z]+)\$/g, (_, base, exp) => `${base}${toSuperscript(exp)}`);

  // Replace raw X^{Y} or X^Y without dollar signs
  processed = processed.replace(/(\d+|[a-zA-Z]+)\^\{([^}]+)\}/g, (_, base, exp) => `${base}${toSuperscript(exp)}`);
  processed = processed.replace(/(\b\d+|[a-zA-Z]+)\^([0-9a-zA-Z]+)/g, (_, base, exp) => `${base}${toSuperscript(exp)}`);

  // Fix table pipe math formatting like "| $2^7$" -> "| 2⁷"
  processed = processed.replace(/\|\s*\$([^$]+)\$\s*/g, (_, mathStr) => {
    const cleanMath = mathStr.replace(/(\d+|[a-zA-Z]+)\^\{?([^}]+)\}?/g, (__: any, b: string, e: string) => `${b}${toSuperscript(e)}`);
    return `| ${cleanMath} `;
  });

  return processed;
}
