// types/index.ts or types.ts

export interface DocumentReference {
  doc_id: number;
  title: string;
  folder_id?: number;
  folder_name?: string;
}

export interface ChatMessage {
  id: number;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  session_id?: string; // Optional, only present in API responses
  documents?: DocumentReference[]; // Optional, documents mentioned in the message
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
  created_at: string;
  updated_at: string;
  starred?: boolean;
}

export interface Document {
  doc_id: number;
  id: number;
  title: string;
  type: string;
  size: number;
  uploadDate: string;
  status: string;
}