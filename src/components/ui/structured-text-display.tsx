import React from 'react';

interface ParsedSection {
  title: string;
  items: string[];
}

interface StructuredTextDisplayProps {
  text: string;
  className?: string;
}

/**
 * Parses text that contains titles followed by numbered or bulleted lists
 * and renders them as structured tables with headers.
 * 
 * Patterns detected:
 * - Numbered items: "1-", "1.", "1)", "(1)"
 * - Bulleted items: "-", "•", "*"
 * - Title: Any text before the first list item
 */
export function StructuredTextDisplay({ text, className = '' }: StructuredTextDisplayProps) {
  if (!text) return null;

  const sections = parseStructuredText(text);

  if (sections.length === 0) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className={className}>
      {sections.map((section, sectionIdx) => (
        <div key={sectionIdx} className={sectionIdx > 0 ? 'mt-4' : ''}>
          {section.title && (
            <p className="font-medium text-foreground mb-2">{section.title}</p>
          )}
          {section.items.length > 0 && (
            <table className="w-full border-collapse">
              <tbody>
                {section.items.map((item, itemIdx) => (
                  <tr key={itemIdx} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5 pr-3 text-muted-foreground font-medium w-8 align-top">
                      {itemIdx + 1}.
                    </td>
                    <td className="py-1.5">{item}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
}

function parseStructuredText(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  
  // Pattern to match numbered items: "1-", "1.", "1)", "(1)"
  const numberedPattern = /(?:^|\s)(?:\(?\d+[-.)]\s*)/;
  // Pattern to match bulleted items: "- ", "• ", "* "
  const bulletPattern = /(?:^|\s)[-•*]\s+/;
  
  // Check if text contains any list patterns
  const hasNumberedList = numberedPattern.test(text);
  const hasBulletList = bulletPattern.test(text);
  
  if (!hasNumberedList && !hasBulletList) {
    // No structured content, return as plain text
    return [];
  }

  // Split by common section patterns (like "In terms of content:", "Requirements:", etc.)
  // Or just process as a single section
  const splitPattern = hasNumberedList 
    ? /(\(?\d+[-.)]\s*)/g 
    : /([-•*]\s+)/g;
  
  const parts = text.split(splitPattern).filter(Boolean);
  
  if (parts.length <= 1) {
    return [];
  }

  // Find where the list starts
  let titleEndIndex = 0;
  for (let i = 0; i < parts.length; i++) {
    if (splitPattern.test(parts[i])) {
      titleEndIndex = i;
      break;
    }
    titleEndIndex = i + 1;
  }

  // Extract title (everything before first list marker)
  const titleParts = parts.slice(0, titleEndIndex);
  const title = titleParts.join('').trim();

  // Extract items (skip the markers, keep the content)
  const items: string[] = [];
  for (let i = titleEndIndex; i < parts.length; i++) {
    const part = parts[i];
    // Skip if this is just a marker
    if (/^[\s]*(?:\(?\d+[-.)]\s*|\s*[-•*])\s*$/.test(part)) {
      continue;
    }
    const trimmed = part.trim();
    if (trimmed) {
      items.push(trimmed);
    }
  }

  if (items.length > 0) {
    sections.push({ title, items });
  }

  return sections;
}

export default StructuredTextDisplay;
