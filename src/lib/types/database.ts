// ==========================================
// ENUMS (miroir du schéma SQL)
// ==========================================

export type UserRole =
  | "admin"
  | "rh"
  | "responsable_qse"
  | "chef_chantier"
  | "technicien"
  | "collaborateur";

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

export type SignalementPriority = "faible" | "moyenne" | "haute" | "critique";

export type ActionPlanStatus = "a_faire" | "en_cours" | "termine" | "annule";

export type ActionPlanType = "corrective" | "preventive";

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
  gender: "" | "M" | "F";
  date_of_birth: string | null;
  hire_date: string | null;
  department: string;
  team: string;
  agency: string;
  manager_id: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  must_change_password: boolean;
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
  news_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  author?: Profile;
  likes_count?: number;
  comments_count?: number;
  news?: News;
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

export interface SignalementCategory {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  position: number;
  created_at: string;
}

export interface DangerReport {
  id: string;
  title: string;
  description: string;
  location: string;
  photo_url: string;
  photo_urls: string[];
  status: DangerStatus;
  severity: number;
  priority: SignalementPriority;
  is_anonymous: boolean;
  category_id: string | null;
  incident_date: string | null;
  incident_time: string | null;
  chantier: string;
  reported_by: string;
  assigned_to: string | null;
  action_plan_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  reporter?: { first_name: string; last_name: string } | null;
  assignee?: { first_name: string; last_name: string } | null;
  category?: SignalementCategory | null;
  action_plan?: ActionPlan | null;
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string;
  type: ActionPlanType;
  priority: SignalementPriority;
  status: ActionPlanStatus;
  responsible_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  responsible?: { first_name: string; last_name: string } | null;
  creator?: { first_name: string; last_name: string } | null;
  tasks?: ActionPlanTask[];
  signalements?: DangerReport[];
}

export interface ActionPlanTask {
  id: string;
  action_plan_id: string;
  label: string;
  is_done: boolean;
  position: number;
  created_at: string;
}

export type RexEventType = "sd" | "presquaccident" | "accident" | "hpe" | "";

export interface Rex {
  id: string;
  title: string;
  description: string;
  lessons_learned: string;
  chantier: string;
  author_id: string;
  created_at: string;
  rex_number: string;
  rex_year: number | null;
  lieu: string;
  date_evenement: string | null;
  horaire: string;
  faits: string;
  faits_photo_url: string;
  causes: string;
  causes_photo_url: string;
  actions_engagees: string;
  actions_photo_url: string;
  vigilance: string;
  vigilance_photo_url: string;
  deja_arrive: string[];
  type_evenement: RexEventType;
  source_file_url: string;
  conclusion_title: string;
  conclusion_content: string;
  type_travaux: string;
}

export interface BonnePratique {
  id: string;
  title: string;
  pillar: string;
  category: string;
  description: string;
  chantier: string;
  photos: string[];
  cover_photo: string;
  difficulty: string;
  priority: string;
  cost_impact: string;
  environmental_impact: string;
  safety_impact: string;
  source_file_url: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: { full_name: string; avatar_url: string };
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

export interface SseDashboard {
  id: string;
  month: number;
  year: number;
  // Indicateurs principaux
  accidents_with_leave: number;
  accidents_with_leave_objective: string;
  regulatory_training_completion: number;
  regulatory_training_objective: string;
  regulatory_compliance_rate: number;
  regulatory_compliance_objective: string;
  periodic_verification_rate: number;
  periodic_verification_objective: string;
  waste_monitoring: number;
  waste_monitoring_objective: string;
  sst_rate: number;
  sst_rate_objective: string;
  downgraded_bins: number;
  downgraded_bins_objective: number;
  // Indicateurs de suivi
  accidents_without_leave: number;
  accidents_without_leave_objective: number;
  cross_visits: number;
  cross_visits_objective: string;
  managerial_visits: number;
  managerial_visits_objective: number;
  sd_declarants_percentage: number;
  sd_declarants_objective: number;
  sd_declared_count: number;
  sd_declared_objective: number;
  waste_awareness_employees: number;
  waste_awareness_objective: string;
  training_plan_follow_rate: number;
  training_plan_objective: string;
  // Sections textuelles
  field_visits_count: number;
  monthly_report: string;
  action_priorities: string[];
  vigilance_points: string[];
  focus_event_title: string;
  focus_event_content: string[];
  quote: string;
  // Meta
  created_by: string | null;
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
  | "action_plan"
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
// NEWS LIKES, SHARES & ATTACHMENTS
// ==========================================

export interface NewsLike {
  id: string;
  news_id: string;
  user_id: string;
  created_at: string;
}

export interface NewsShare {
  id: string;
  news_id: string;
  user_id: string;
  created_at: string;
}

export interface NewsAttachment {
  id: string;
  news_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string;
  uploaded_by: string | null;
  created_at: string;
}

// ==========================================
// INTERNAL MESSAGES
// ==========================================

export interface InternalMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  from_user?: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">;
  to_user?: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">;
}

export interface Conversation {
  user: Pick<Profile, "id" | "first_name" | "last_name" | "avatar_url">;
  lastMessage: InternalMessage;
  unreadCount: number;
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
// APP SETTINGS
// ==========================================

export interface AppSetting {
  id: string;
  key: string;
  value: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
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

export interface QseDocument {
  title: string;
  file_url: string;
}

export interface QseContent {
  id: string;
  type: string;
  title: string;
  sections: QseContentSection[];
  source_file_url: string;
  year: number | null;
  date_signature: string | null;
  documents: QseDocument[];
  engagement_text: string;
  engagement_lieu: string;
  signataires: string[];
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

// ==========================================
// TEAM MEMBERS
// ==========================================

export type TeamMemberRole = "manager" | "member";

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamMemberRole;
  created_at: string;
}

export interface TeamWithMembers {
  id: string;
  label: string;
  description: string;
  department_id: string | null;
  created_at: string;
  members: (TeamMember & { profile: Pick<Profile, "id" | "first_name" | "last_name" | "email" | "avatar_url" | "job_title" | "role"> })[];
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
