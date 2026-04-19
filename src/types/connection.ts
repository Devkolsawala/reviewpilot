export interface Connection {
  id: string;
  user_id: string;
  type: "google_business" | "play_store";
  name: string;
  external_id?: string;
  credentials?: Record<string, unknown>;
  is_active: boolean;
  last_synced_at?: string | null;
  review_count?: number;
  created_at: string;
  initial_sync_completed_at?: string | null;
}
