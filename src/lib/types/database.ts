// ==========================================
// ENUMS (miroir du schéma SQL)
// ==========================================

export type UserRole =
  | "admin"
  | "rh"
  | "responsable_qse"
  | "chef_chantier"
  | "technicien";

export type NewsCategory =
  | "entreprise"
  | "securite"
  | "formation"
  | "chantier"
  | "social"
  | "rh";

export type NewsPriority = "normal" | "important" | "urgent";

export type EventColor = "yellow" | "blue" | "purple" | "green" | "red";

export type TodoStatus = "pending" | "done";

export type TimebitMode = "chantier" | "bureau";

export type DangerStatus = "signale" | "en_cours" | "resolu" | "cloture";

export type CongeStatus = "en_attente" | "approuve" | "refuse";

export type CongeType =
  | "conge_paye"
  | "rtt"
  | "maladie"
  | "sans_solde"
  | "exceptionnel";

// ==========================================
// TABLES
// ==========================================

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  job_title: string;
  phone: string;
  avatar_url: string;
  date_of_birth: string | null;
  hire_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: NewsCategory;
  priority: NewsPriority;
  image_url: string;
  is_carousel: boolean;
  is_published: boolean;
  author_id: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  color: EventColor;
  start_at: string;
  end_at: string | null;
  is_all_day: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: "invited" | "accepted" | "declined";
}

export interface Todo {
  id: string;
  user_id: string;
  label: string;
  status: TodoStatus;
  position: number;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  category: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface Timebit {
  id: string;
  user_id: string;
  mode: TimebitMode;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  notes: string;
  created_at: string;
}

export interface FeedPost {
  id: string;
  author_id: string;
  content: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  likes_count?: number;
  comments_count?: number;
}

export interface FeedLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

export interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string;
  album: string;
  uploaded_by: string | null;
  created_at: string;
}

// QSE

export interface DangerReport {
  id: string;
  title: string;
  description: string;
  location: string;
  photo_url: string;
  status: DangerStatus;
  severity: number;
  reported_by: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Rex {
  id: string;
  title: string;
  description: string;
  lessons_learned: string;
  chantier: string;
  author_id: string;
  created_at: string;
}

export interface SseIndicator {
  id: string;
  period: string;
  accidents_with_leave: number;
  accidents_without_leave: number;
  near_misses: number;
  danger_situations: number;
  hours_worked: number;
  frequency_rate: number;
  severity_rate: number;
  created_at: string;
  updated_at: string;
}

// RH

export interface Formation {
  id: string;
  title: string;
  description: string;
  organisme: string;
  date_start: string | null;
  date_end: string | null;
  max_participants: number;
  is_mandatory: boolean;
  created_at: string;
}

export interface FormationRegistration {
  id: string;
  formation_id: string;
  user_id: string;
  status: "inscrit" | "confirme" | "annule" | "termine";
  registered_at: string;
}

export interface Conge {
  id: string;
  user_id: string;
  type: CongeType;
  date_start: string;
  date_end: string;
  reason: string;
  status: CongeStatus;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export type NotificationType =
  | "news"
  | "event"
  | "birthday"
  | "comment"
  | "conge"
  | "danger"
  | "formation"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  related_id: string | null;
  created_at: string;
}

// ==========================================
// NEWS VIEWS & COMMENTS
// ==========================================

export interface NewsView {
  id: string;
  news_id: string;
  user_id: string;
  viewed_at: string;
}

export interface NewsComment {
  id: string;
  news_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: Profile;
}

// ==========================================
// BIRTHDAY WISHES
// ==========================================

export interface BirthdayWish {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  year: number;
  created_at: string;
  from_user?: Profile;
}

// ==========================================
// AI CREDITS
// ==========================================

export interface AiCredit {
  id: string;
  user_id: string;
  credits_used: number;
  credits_limit: number;
  period: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// QSE CONTENT
// ==========================================

export interface QseContentSection {
  title: string;
  content: string;
}

export interface QseContent {
  id: string;
  type: string;
  title: string;
  sections: QseContentSection[];
  source_file_url: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ==========================================
// PROFIL UTILISATEUR
// ==========================================

export interface UserExperience {
  id: string;
  user_id: string;
  company: string;
  job_title: string;
  location: string;
  date_start: string;
  date_end: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface UserDiploma {
  id: string;
  user_id: string;
  title: string;
  school: string;
  year_obtained: number | null;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface UserFormation {
  id: string;
  user_id: string;
  title: string;
  organisme: string;
  date_obtained: string | null;
  expiry_date: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}
