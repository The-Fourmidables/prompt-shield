
import { EntityType, DetectedEntity, InspectionResult } from '../types';

/**
 * Prompt-Shield Inspector
 * Uses pattern matching and conversational context to detect PII.
 */
export class PromptInspector {
  private patterns = [
    { type: EntityType.EMAIL, regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g },
    { type: EntityType.PHONE, regex: /(\+\d{1,2}\s?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g },
    { type: EntityType.CREDIT_CARD, regex: /\b(?:\d[ -]*?){13,16}\b/g },
    { type: EntityType.IP_ADDRESS, regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g },
    { type: EntityType.API_KEY, regex: /(?:sk-|key-|ghp_|token-)[a-zA-Z0-9]{20,}/g },
    // Catch common PII intro patterns like "my name is [Name]" or "I am [Name]"
    { type: EntityType.PERSON, regex: /(?:my name is|i'm|i am|call me|this is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*|[a-z]+)/gi },
    // Standalone common names (Simulated NER list)
    { type: EntityType.PERSON, regex: /\b(?:John|Jane|Alice|Bob|Charlie|Meet|Sarah|David|Emma|James|Robert)\b/gi },
    // Organizations
    { type: EntityType.ORGANIZATION, regex: /\b(?:Google|Amazon|Microsoft|Apple|Tesla|Meta|OpenAI|Anthropic)\b/gi },
  ];

  public inspect(text: string): InspectionResult {
    const entities: DetectedEntity[] = [];
    const typeCounts: Record<string, number> = {};
    const seenRanges: {start: number, end: number}[] = [];

    this.patterns.forEach(({ type, regex }) => {
      const localRegex = new RegExp(regex);
      let match;
      
      while ((match = localRegex.exec(text)) !== null) {
        // Handle captured groups (e.g., for "my name is X", we want X)
        const fullMatch = match[0];
        const value = match[1] || fullMatch;
        
        // Calculate the actual start/end of the sensitive value
        const valueStartIndex = match.index + fullMatch.indexOf(value);
        const valueEndIndex = valueStartIndex + value.length;

        // Prevent overlapping detections (pick the first/best)
        if (seenRanges.some(r => (valueStartIndex >= r.start && valueStartIndex < r.end) || (valueEndIndex > r.start && valueEndIndex <= r.end))) {
          continue;
        }

        typeCounts[type] = (typeCounts[type] || 0) + 1;
        const placeholder = `{{${type}_${typeCounts[type]}}}`;

        entities.push({
          id: `ent-${Math.random().toString(36).substr(2, 9)}`,
          type,
          value,
          placeholder,
          startIndex: valueStartIndex,
          endIndex: valueEndIndex
        });
        
        seenRanges.push({ start: valueStartIndex, end: valueEndIndex });
      }
    });

    // Sort entities by index descending to replace without breaking indices
    const sortedEntities = [...entities].sort((a, b) => b.startIndex - a.startIndex);
    
    let maskedText = text;
    sortedEntities.forEach(entity => {
      maskedText = 
        maskedText.substring(0, entity.startIndex) + 
        entity.placeholder + 
        maskedText.substring(entity.endIndex);
    });

    return {
      originalText: text,
      maskedText,
      entities
    };
  }
}

export const inspector = new PromptInspector();
