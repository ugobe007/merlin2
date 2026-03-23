/**
 * Company Name Extraction Utilities
 * 
 * Cleans and validates company names from scraped articles
 * Filters out junk, fragments, and generic terms
 */

// Common junk patterns to filter out
const JUNK_PATTERNS = {
  // Generic words that aren't company names
  genericWords: new Set([
    'new', 'data', 'green', 'first', 'how', 'building', 'trump',
    'opening', 'construction', 'expansion', 'announces', 'celebrates',
    'acquires', 'starts', 'and', 'the', 'a', 'an', 'in', 'on', 'at'
  ]),
  
  // Phrases that indicate article fragments
  articleFragments: [
    /^\d+\s+(biggest|notable|major|top)/i,
    /^how\s+/i,
    /^building\s+/i,
    /^groundbreaking\s+/i,
    /.*(opening|celebrates|announces|starts|acquires)\s*$/i,
    /.*\s+and\s*$/i
  ],
  
  // Invalid characters
  invalidChars: /[<>{}[\]\\|@]/,
  
  // URL patterns
  urlPattern: /https?:\/\//,
  
  // Numbers only
  numbersOnly: /^\d+$/,
};

/**
 * Clean and validate a company name
 */
export function cleanCompanyName(rawName: string | null | undefined): string | null {
  if (!rawName || typeof rawName !== 'string') {
    return null;
  }
  
  // Trim whitespace
  let cleaned = rawName.trim();
  
  // Too short
  if (cleaned.length < 3) {
    return null;
  }
  
  // Contains invalid characters
  if (JUNK_PATTERNS.invalidChars.test(cleaned)) {
    return null;
  }
  
  // Contains URL
  if (JUNK_PATTERNS.urlPattern.test(cleaned)) {
    return null;
  }
  
  // Only numbers
  if (JUNK_PATTERNS.numbersOnly.test(cleaned)) {
    return null;
  }
  
  // Generic single word
  if (JUNK_PATTERNS.genericWords.has(cleaned.toLowerCase())) {
    return null;
  }
  
  // Article fragments
  for (const pattern of JUNK_PATTERNS.articleFragments) {
    if (pattern.test(cleaned)) {
      return null;
    }
  }
  
  // All caps (likely a headline, not a company name) - unless it's an acronym (<=5 chars)
  if (cleaned === cleaned.toUpperCase() && cleaned.length > 5) {
    return null;
  }
  
  return cleaned;
}

/**
 * Extract company name from article title
 * Handles common patterns like "Company Name Opens New Facility"
 */
export function extractCompanyFromTitle(title: string): string | null {
  if (!title) return null;
  
  // Common patterns:
  // "Company Name Opens/Announces/Starts/Expands..."
  // "Company Name to Open/Build..."
  // "Company Name is Opening..."
  
  const patterns = [
    // "Company Name Opens..."
    /^([^:]+?)\s+(opens?|announces?|starts?|expands?|celebrates?|builds?|acquires?)\s/i,
    
    // "Company Name to Open..."
    /^([^:]+?)\s+to\s+(open|build|expand|acquire|start)\s/i,
    
    // "Company Name is Opening..."
    /^([^:]+?)\s+(is|are)\s+(opening|building|expanding|acquiring)\s/i,
    
    // "Company Name's New..."
    /^([^:]+?)['']s\s+(new|latest)\s/i,
    
    // Before a dash or colon (common in headlines)
    /^([^:—–-]+?)\s*[:—–-]\s/,
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      return cleanCompanyName(candidate);
    }
  }
  
  // Fallback: take first few words before common verbs
  const words = title.split(/\s+/);
  if (words.length >= 2) {
    const firstTwoWords = words.slice(0, 2).join(' ');
    return cleanCompanyName(firstTwoWords);
  }
  
  return null;
}

/**
 * Validate if a company name looks legitimate
 */
export function isValidCompanyName(name: string): boolean {
  const cleaned = cleanCompanyName(name);
  if (!cleaned) return false;
  
  // Should have at least 5 characters for real companies
  if (cleaned.length < 5) return false;
  
  // Should not start with a number
  if (/^\d/.test(cleaned)) return false;
  
  // Should have at least one letter
  if (!/[a-zA-Z]/.test(cleaned)) return false;
  
  return true;
}

/**
 * Score company name quality (0-100)
 */
export function scoreCompanyName(name: string): number {
  if (!name) return 0;
  
  let score = 50; // Start at 50
  
  // Length bonus (optimal 10-50 chars)
  if (name.length >= 10 && name.length <= 50) {
    score += 20;
  } else if (name.length >= 5 && name.length < 10) {
    score += 10;
  }
  
  // Has multiple words (likely a real company)
  if (name.split(/\s+/).length >= 2) {
    score += 15;
  }
  
  // Contains common company suffixes
  if (/\b(Inc|LLC|Ltd|Corp|Corporation|Company|Co|Group|Industries|International|Solutions|Services|Technologies|Tech|Energy|Logistics)\b/i.test(name)) {
    score += 15;
  }
  
  // Proper capitalization (not all caps or all lowercase)
  const hasUpperCase = /[A-Z]/.test(name);
  const hasLowerCase = /[a-z]/.test(name);
  if (hasUpperCase && hasLowerCase) {
    score += 10;
  }
  
  // Penalty for starting with number
  if (/^\d/.test(name)) {
    score -= 30;
  }
  
  // Penalty for generic words
  if (JUNK_PATTERNS.genericWords.has(name.toLowerCase())) {
    score -= 40;
  }
  
  return Math.max(0, Math.min(100, score));
}
