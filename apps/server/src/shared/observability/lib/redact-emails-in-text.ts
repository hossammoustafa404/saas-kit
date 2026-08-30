interface ParsedSpan {
  start: number;
  end: number;
}

const LOCAL_PART_ATOM_CHARS = new Set(
  "!#$%&'*+-/=?^_`{|}~.".split(''),
);
const DOMAIN_LITERAL_CHARS = new Set('.:'.split(''));
const DOMAIN_STRUCTURAL_CHARS = new Set(
  '@[]()<>,;:"\\'.split(''),
);

export function redactEmailsInText(
  text: string,
  redactedValue: string,
): string {
  if (text === '') {
    return text;
  }

  const spans = findEmailSpans(text);
  if (spans.length === 0) {
    return text;
  }

  let result = '';
  let lastEnd = 0;

  for (const span of spans) {
    result += text.slice(lastEnd, span.start) + redactedValue;
    lastEnd = span.end;
  }

  return result + text.slice(lastEnd);
}

function findEmailSpans(text: string): ParsedSpan[] {
  const spans: ParsedSpan[] = [];

  for (let atIndex = 0; atIndex < text.length; atIndex++) {
    if (text[atIndex] !== '@' || isAtInsideQuotedString(text, atIndex)) {
      continue;
    }

    const localPart = parseLocalPart(text, atIndex);
    if (localPart === null) {
      continue;
    }

    const domain = parseDomain(text, atIndex + 1);
    if (domain === null) {
      continue;
    }

    const start = localPart.start;
    const end = domain.end;

    if (!hasEmailBoundary(text, start, end)) {
      continue;
    }

    spans.push({ start, end });
  }

  return mergeSpans(spans);
}

function isAtInsideQuotedString(text: string, atIndex: number): boolean {
  let quoteCount = 0;

  for (let index = 0; index < atIndex; index++) {
    if (text[index] === '\\' && index + 1 < atIndex) {
      index++;
      continue;
    }

    if (text[index] === '"') {
      quoteCount++;
    }
  }

  return quoteCount % 2 === 1;
}

function parseLocalPart(text: string, atIndex: number): ParsedSpan | null {
  const closingQuoteIndex = atIndex - 1;

  if (closingQuoteIndex >= 0 && text[closingQuoteIndex] === '"') {
    return parseQuotedLocalPart(text, closingQuoteIndex);
  }

  return parseDotAtomLocalPart(text, atIndex);
}

function parseQuotedLocalPart(
  text: string,
  closingQuoteIndex: number,
): ParsedSpan | null {
  for (let index = closingQuoteIndex - 1; index >= 0; index--) {
    if (text[index] === '"') {
      if (index > 0 && text[index - 1] === '\\') {
        index -= 2;
        continue;
      }

      return { start: index, end: closingQuoteIndex + 1 };
    }
  }

  return null;
}

function parseDotAtomLocalPart(
  text: string,
  atIndex: number,
): ParsedSpan | null {
  let index = atIndex - 1;

  while (index >= 0 && isLocalPartChar(text[index])) {
    if (text[index] === '"') {
      return null;
    }

    index--;
  }

  const start = index + 1;

  if (start >= atIndex) {
    return null;
  }

  return { start, end: atIndex };
}

function parseDomain(text: string, start: number): ParsedSpan | null {
  if (start >= text.length) {
    return null;
  }

  if (text[start] === '[') {
    return parseDomainLiteral(text, start);
  }

  return parseDomainName(text, start);
}

function parseDomainLiteral(text: string, start: number): ParsedSpan | null {
  if (text[start] !== '[') {
    return null;
  }

  let index = start + 1;

  if (text.startsWith('IPv6:', index)) {
    index += 'IPv6:'.length;

    while (index < text.length && isDomainLiteralChar(text[index])) {
      index++;
    }
  } else {
    while (index < text.length && isIpv4LiteralChar(text[index])) {
      index++;
    }
  }

  if (index >= text.length || text[index] !== ']') {
    return null;
  }

  return { start, end: index + 1 };
}

function parseDomainName(text: string, start: number): ParsedSpan | null {
  let index = start;
  let sawLabelChar = false;

  while (index < text.length) {
    const char = text[index];

    if (isDomainLabelChar(char)) {
      sawLabelChar = true;
      index++;
      continue;
    }

    if (char === '.') {
      if (!sawLabelChar) {
        return null;
      }

      sawLabelChar = false;
      index++;
      continue;
    }

    break;
  }

  if (!sawLabelChar) {
    return null;
  }

  return { start, end: index };
}

function hasEmailBoundary(text: string, start: number, end: number): boolean {
  if (start > 0) {
    const previous = text[start - 1];

    if (
      isLocalPartChar(previous) ||
      previous === '"' ||
      previous === '@'
    ) {
      return false;
    }
  }

  if (end < text.length) {
    const next = text[end];

    if (isDomainLabelChar(next) || next === '@' || next === '[') {
      return false;
    }
  }

  return true;
}

function mergeSpans(spans: ParsedSpan[]): ParsedSpan[] {
  if (spans.length === 0) {
    return spans;
  }

  const sorted = [...spans].sort((left, right) => left.start - right.start);
  const merged: ParsedSpan[] = [sorted[0]];

  for (let index = 1; index < sorted.length; index++) {
    const current = sorted[index];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      continue;
    }

    merged.push(current);
  }

  return merged;
}

function isLocalPartChar(char: string): boolean {
  if (isAsciiLetterOrDigit(char) || LOCAL_PART_ATOM_CHARS.has(char)) {
    return true;
  }

  return isInternationalizedEmailChar(char);
}

function isDomainLabelChar(char: string): boolean {
  if (char === '-') {
    return true;
  }

  if (isAsciiLetterOrDigit(char)) {
    return true;
  }

  return isInternationalizedEmailChar(char);
}

function isDomainLiteralChar(char: string): boolean {
  return (
    isHexDigit(char) ||
    DOMAIN_LITERAL_CHARS.has(char) ||
    isIpv4LiteralChar(char)
  );
}

function isIpv4LiteralChar(char: string): boolean {
  return isAsciiDigit(char) || char === '.';
}

function isAsciiLetterOrDigit(char: string): boolean {
  const code = char.charCodeAt(0);

  return (
    (code >= 0x41 && code <= 0x5a) ||
    (code >= 0x61 && code <= 0x7a) ||
    (code >= 0x30 && code <= 0x39)
  );
}

function isAsciiDigit(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x30 && code <= 0x39;
}

function isHexDigit(char: string): boolean {
  const code = char.charCodeAt(0);

  return (
    (code >= 0x30 && code <= 0x39) ||
    (code >= 0x41 && code <= 0x46) ||
    (code >= 0x61 && code <= 0x66)
  );
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\t' || char === '\n' || char === '\r';
}

function isInternationalizedEmailChar(char: string): boolean {
  const codePoint = char.codePointAt(0);

  if (codePoint === undefined || codePoint <= 0x7f) {
    return false;
  }

  return !DOMAIN_STRUCTURAL_CHARS.has(char) && !isWhitespace(char);
}
