export type ConnectionType = "google_business" | "play_store" | "whatsapp";

export interface Connection {
  id: string;
  user_id: string;
  type: ConnectionType;
  name: string;
  external_id?: string;
  credentials?: Record<string, unknown>;
  is_active: boolean;
  last_synced_at?: string | null;
  review_count?: number;
  created_at: string;
  initial_sync_completed_at?: string | null;
  // WhatsApp-specific (nullable for other types)
  whatsapp_phone_number_id?: string | null;
  whatsapp_business_account_id?: string | null;
  whatsapp_display_phone_number?: string | null;
  whatsapp_access_token_encrypted?: string | null;
}

/** Metadata for a WhatsApp connection — the raw access token is NEVER stored in the frontend type. */
export interface WhatsAppConnectionMeta {
  phoneNumberId: string;
  wabaId: string;
  displayPhoneNumber: string;
  tokenRef: string; // reference/identifier only, not the token itself
}
