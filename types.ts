
export interface Stakeholder {
  name: string;
  role: string;
  contribution: string;
}

export interface AgendaTopic {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  presenter: string;
}

export interface MeetingAgenda {
  title: string;
  objective: string;
  stakeholders: Stakeholder[];
  topics: AgendaTopic[];
  totalDurationMinutes: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface FileData {
  id: string;
  name: string;
  type: string;
  content: string; // base64 or text
  processed: boolean;
  agenda?: MeetingAgenda;
}
