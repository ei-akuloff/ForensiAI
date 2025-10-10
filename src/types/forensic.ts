/**
 * Forensic Data Types - Cellebrite Physical Analyzer inspired
 * TypeScript interfaces for messenger, call logs, and Find My location data
 */

export type MessageType = "sent" | "received" | "deleted";
export type CallType = "incoming" | "outgoing" | "missed" | "rejected" | "blocked";

export interface MessengerMessage {
  message_id: string;
  session_id: string;
  case_id: string;
  app_name: string; // "messenger", "whatsapp", "telegram", etc.
  account_id?: string;
  account_name?: string;
  message_type: MessageType;
  sender: string;
  receiver: string;
  content?: string;
  timestamp: string;
  is_encrypted: boolean;
  encryption_type?: string;
  has_attachments: boolean;
  attachment_count: number;
  attachment_types: string[];
  latitude?: number;
  longitude?: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MessengerCall {
  call_id: string;
  session_id: string;
  case_id: string;
  app_name: string;
  call_type: CallType;
  caller: string;
  receiver: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  is_video: boolean;
  call_quality?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MessengerAccount {
  account_id: string;
  session_id: string;
  case_id: string;
  app_name: string;
  username?: string;
  display_name?: string;
  phone_number?: string;
  email?: string;
  profile_picture_url?: string;
  account_created?: string;
  last_active?: string;
  is_encrypted: boolean;
  encryption_status: "encrypted" | "decrypted" | "partially_decrypted" | "unknown";
  message_count: number;
  call_count: number;
  contacts: string[];
  metadata: Record<string, any>;
  created_at: string;
}

export interface CallLog {
  call_log_id: string;
  session_id: string;
  case_id: string;
  call_type: CallType;
  phone_number: string;
  contact_name?: string;
  timestamp: string;
  duration_seconds?: number;
  sim_card?: string;
  network_type?: string;
  cell_tower_id?: string;
  latitude?: number;
  longitude?: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface FindMyLocation {
  location_id: string;
  session_id: string;
  case_id: string;
  device_name: string;
  device_model?: string;
  device_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: string;
  battery_level?: number;
  is_charging?: boolean;
  location_source: string;
  speed?: number;
  heading?: number;
  address?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ForensicSummary {
  summary_id: string;
  session_id: string;
  case_id: string;
  messenger_accounts: number;
  messenger_messages: number;
  messenger_calls: number;
  call_logs: number;
  find_my_locations: number;
  earliest_activity?: string;
  latest_activity?: string;
  top_contacts: Array<{
    contact: string;
    count: number;
  }>;
  most_active_apps: Array<{
    app: string;
    count: number;
  }>;
  location_clusters: Array<{
    latitude: number;
    longitude: number;
    count: number;
    address?: string;
  }>;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MessengerData {
  messages: MessengerMessage[];
  calls: MessengerCall[];
  accounts: MessengerAccount[];
  total_messages: number;
  total_calls: number;
  total_accounts: number;
}

export interface CallLogsData {
  call_logs: CallLog[];
  total_calls: number;
}

export interface FindMyData {
  locations: FindMyLocation[];
  total_locations: number;
}

export interface ForensicParseResult {
  message: string;
  counts: {
    messenger_messages: number;
    messenger_calls: number;
    messenger_accounts: number;
    call_logs: number;
    find_my_locations: number;
  };
  summary: ForensicSummary;
}

// Helper types for filtering and display
export interface TimelineEvent {
  id: string;
  type: "message" | "call" | "location" | "call_log";
  timestamp: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  details: any;
}

export interface CommunicationStats {
  totalMessages: number;
  totalCalls: number;
  totalDuration: number;
  messagesPerDay: Record<string, number>;
  callsPerDay: Record<string, number>;
  topContacts: Array<{
    name: string;
    messages: number;
    calls: number;
    total: number;
  }>;
  appUsage: Record<string, number>;
}

export interface LocationCluster {
  center: {
    lat: number;
    lng: number;
  };
  points: FindMyLocation[];
  count: number;
  address?: string;
  timeRange: {
    start: string;
    end: string;
  };
}
