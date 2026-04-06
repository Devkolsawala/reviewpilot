export interface Campaign {
  id: string;
  connection_id: string;
  type: "sms" | "email";
  name: string;
  message_template: string;
  review_link?: string;
  status: "draft" | "active" | "paused" | "completed";
  total_sent: number;
  total_clicked: number;
  created_at: string;
}

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  name?: string;
  phone?: string;
  email?: string;
  status: "pending" | "sent" | "delivered" | "clicked" | "reviewed" | "failed";
  sent_at?: string;
}
