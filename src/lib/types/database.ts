export type GoalType = "daily_binary" | "weekly_count" | "daily_count";

export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  onboarding_completed_at: string | null;
}

export interface Goal {
  id: string;
  owner_id: string | null;
  title: string;
  description: string | null;
  type: GoalType;
  target_per_period: number | null;
  icon: string | null;
  color: string | null;
  is_template: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface GoalEntry {
  id: string;
  goal_id: string;
  user_id: string;
  entry_date: string;
  value: number;
  note: string | null;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  slug: string;
  invite_code: string;
  created_by: string;
  created_at: string;
}
