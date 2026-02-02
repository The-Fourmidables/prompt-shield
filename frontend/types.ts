
export enum EntityType {
  PERSON = 'PERSON',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  CREDIT_CARD = 'CREDIT_CARD',
  ADDRESS = 'ADDRESS',
  ORGANIZATION = 'ORGANIZATION',
  IP_ADDRESS = 'IP_ADDRESS',
  API_KEY = 'API_KEY'
}

export interface DetectedEntity {
  id: string;
  type: EntityType;
  value: string;
  placeholder: string;
  startIndex: number;
  endIndex: number;
}

export interface InspectionResult {
  originalText: string;
  maskedText: string;
  entities: DetectedEntity[];
}

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  timestamp: number;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: string;
  data: string; // base64 encoded
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  rawText: string;
  maskedText: string;
  rehydratedText: string;
  entities: DetectedEntity[];
  timestamp: number;
  attachments?: ChatAttachment[];
}
