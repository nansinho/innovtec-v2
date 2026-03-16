import type { BadgeVariant } from "@/components/ui/badge";

// ─── Type partagé ───

export interface StatusEntry {
  label: string;
  variant: BadgeVariant;
}

// ─── TABLEAU DE BORD (Dashboard) ───

export const KPI_TREND_MAP: Record<string, StatusEntry> = {
  en_hausse: { label: "En hausse", variant: "red" },
  stable: { label: "Stable", variant: "amber" },
  en_baisse: { label: "En baisse", variant: "green" },
  objectif: { label: "Objectif", variant: "teal" },
};

export const DASHBOARD_COUNTER_MAP: Record<string, StatusEntry> = {
  documents: { label: "Documents", variant: "blue" },
  collaborateurs: { label: "Collaborateurs", variant: "green" },
  reunions: { label: "Réunions du jour", variant: "blue" },
  taches: { label: "Tâches en cours", variant: "amber" },
};

export const ACCES_RAPIDE_MAP: Record<string, StatusEntry> = {
  mail: { label: "Mail", variant: "red" },
  calendrier: { label: "Calendrier", variant: "blue" },
  drive: { label: "Drive", variant: "green" },
  chat: { label: "Chat", variant: "teal" },
  bureau: { label: "Bureau", variant: "gray" },
  qse: { label: "QSE", variant: "coral" },
};

// ─── ACTUALITÉS / BLOG ───

export const ARTICLE_STATUS_MAP: Record<string, StatusEntry> = {
  brouillon: { label: "Brouillon", variant: "gray" },
  en_revue: { label: "En revue", variant: "purple" },
  publie: { label: "Publié", variant: "green" },
  archive: { label: "Archivé", variant: "gray" },
  planifie: { label: "Planifié", variant: "blue" },
};

export const ARTICLE_CATEGORY_MAP: Record<string, StatusEntry> = {
  securite: { label: "Sécurité", variant: "red" },
  qse: { label: "QSE", variant: "teal" },
  rex: { label: "REX", variant: "purple" },
  entreprise: { label: "Entreprise", variant: "blue" },
  rh: { label: "RH", variant: "amber" },
  formation: { label: "Formation", variant: "teal" },
  evenement: { label: "Événement", variant: "pink" },
  vie_sociale: { label: "Vie sociale", variant: "pink" },
  info: { label: "Info", variant: "gray" },
  chantier: { label: "Chantier", variant: "coral" },
};

export const ARTICLE_IMPORTANCE_MAP: Record<string, StatusEntry> = {
  important: { label: "Important", variant: "coral" },
  normal: { label: "Normal", variant: "gray" },
};

export const REACTION_TYPE_MAP: Record<string, StatusEntry> = {
  like: { label: "J'aime", variant: "blue" },
  bravo: { label: "Bravo", variant: "green" },
  utile: { label: "Utile", variant: "teal" },
  partage: { label: "Partagé", variant: "purple" },
};

// ─── VIE SOCIALE ───

export const VIE_SOCIALE_TYPE_MAP: Record<string, StatusEntry> = {
  anniversaire: { label: "Anniversaire", variant: "pink" },
  pot_depart: { label: "Pot de départ", variant: "amber" },
  bienvenue: { label: "Bienvenue", variant: "green" },
  team_building: { label: "Team building", variant: "blue" },
  fete: { label: "Fête", variant: "pink" },
  autre: { label: "Autre", variant: "gray" },
};

export const ANNIVERSAIRE_BADGE_MAP: Record<string, StatusEntry> = {
  aujourdhui: { label: "Aujourd'hui", variant: "pink" },
  cette_semaine: { label: "Cette semaine", variant: "amber" },
  ce_mois: { label: "Ce mois", variant: "gray" },
};

// ─── QSE (Qualité, Sécurité, Environnement) ───

export const QSE_DOC_STATUS_MAP: Record<string, StatusEntry> = {
  brouillon: { label: "Brouillon", variant: "gray" },
  en_revue: { label: "En revue", variant: "purple" },
  actif: { label: "En vigueur", variant: "green" },
  obsolete: { label: "Obsolète", variant: "gray" },
};

export const SIGNALEMENT_STATUS_MAP: Record<string, StatusEntry> = {
  declare: { label: "Déclaré", variant: "red" },
  en_analyse: { label: "En analyse", variant: "amber" },
  en_cours: { label: "En cours", variant: "amber" },
  traite: { label: "Traité", variant: "green" },
  clos: { label: "Clos", variant: "gray" },
  // Legacy keys for existing data
  signale: { label: "Signalé", variant: "red" },
  resolu: { label: "Résolu", variant: "green" },
  cloture: { label: "Clôturé", variant: "gray" },
};

export const SIGNALEMENT_GRAVITE_MAP: Record<string, StatusEntry> = {
  critique: { label: "Critique", variant: "red" },
  grave: { label: "Grave", variant: "coral" },
  moderee: { label: "Modérée", variant: "amber" },
  mineure: { label: "Mineure", variant: "gray" },
};

export const INCIDENT_TYPE_MAP: Record<string, StatusEntry> = {
  accident_travail: { label: "Accident travail", variant: "red" },
  presqu_accident: { label: "Presqu'accident", variant: "coral" },
  situation_danger: { label: "Situation dangereuse", variant: "amber" },
  dommage_ouvrage: { label: "Dommage ouvrage", variant: "red" },
  dommage_reseau: { label: "Dommage réseau", variant: "coral" },
  non_conformite: { label: "Non-conformité", variant: "purple" },
  environnemental: { label: "Environnemental", variant: "teal" },
  autre: { label: "Autre", variant: "gray" },
  // Legacy keys
  sd: { label: "Situation dangereuse", variant: "amber" },
  presquaccident: { label: "Presqu'accident", variant: "coral" },
  accident: { label: "Accident", variant: "red" },
  hpe: { label: "HPE", variant: "purple" },
};

export const PLAN_ACTION_STATUS_MAP: Record<string, StatusEntry> = {
  a_planifier: { label: "À planifier", variant: "blue" },
  en_cours: { label: "En cours", variant: "amber" },
  en_retard: { label: "En retard", variant: "red" },
  cloture: { label: "Clôturé", variant: "green" },
  annule: { label: "Annulé", variant: "gray" },
  // Legacy keys
  a_faire: { label: "À faire", variant: "blue" },
  termine: { label: "Terminé", variant: "green" },
};

export const REX_STATUS_MAP: Record<string, StatusEntry> = {
  brouillon: { label: "Brouillon", variant: "gray" },
  en_analyse: { label: "En analyse", variant: "amber" },
  publie: { label: "Publié", variant: "purple" },
  archive: { label: "Archivé", variant: "gray" },
};

export const REX_TYPE_MAP: Record<string, StatusEntry> = {
  positif: { label: "Positif", variant: "green" },
  negatif: { label: "Négatif", variant: "red" },
  neutre: { label: "Neutre", variant: "gray" },
};

export const BONNE_PRATIQUE_CATEGORY_MAP: Record<string, StatusEntry> = {
  securite: { label: "Sécurité", variant: "red" },
  environnement: { label: "Environnement", variant: "teal" },
  qualite: { label: "Qualité", variant: "purple" },
  sante: { label: "Santé", variant: "pink" },
  general: { label: "Général", variant: "gray" },
};

export const SSE_CONFORMITE_MAP: Record<string, StatusEntry> = {
  conforme: { label: "Conforme", variant: "green" },
  a_ameliorer: { label: "À améliorer", variant: "amber" },
  non_conforme: { label: "Non conforme", variant: "red" },
  non_evalue: { label: "Non évalué", variant: "gray" },
};

// ─── ÉQUIPE ───

export const COLLABORATEUR_STATUS_MAP: Record<string, StatusEntry> = {
  actif: { label: "Actif", variant: "green" },
  en_conge: { label: "En congé", variant: "amber" },
  en_mission: { label: "En mission", variant: "blue" },
  absent: { label: "Absent", variant: "red" },
  inactif: { label: "Inactif", variant: "gray" },
  parti: { label: "Parti", variant: "gray" },
};

export const PRESENCE_MAP: Record<string, StatusEntry> = {
  en_ligne: { label: "En ligne", variant: "green" },
  absent: { label: "Absent", variant: "amber" },
  hors_ligne: { label: "Hors ligne", variant: "gray" },
  ne_pas_deranger: { label: "Ne pas déranger", variant: "red" },
};

export const ROLE_MAP: Record<string, StatusEntry> = {
  directeur: { label: "Directeur", variant: "coral" },
  manager: { label: "Manager", variant: "blue" },
  collaborateur: { label: "Collaborateur", variant: "green" },
  admin: { label: "Admin", variant: "purple" },
  stagiaire: { label: "Stagiaire", variant: "amber" },
  externe: { label: "Externe", variant: "gray" },
};

export const EQUIPE_MAP: Record<string, StatusEntry> = {
  direction: { label: "Direction", variant: "coral" },
  exploitation: { label: "Exploitation", variant: "green" },
  bureau_etude: { label: "Bureau d'étude", variant: "blue" },
  rh: { label: "RH", variant: "pink" },
  qse: { label: "QSE", variant: "teal" },
  administratif: { label: "Administratif", variant: "gray" },
  chantier: { label: "Chantier", variant: "coral" },
  maintenance: { label: "Maintenance", variant: "amber" },
  // Legacy display-name keys
  Travaux: { label: "Travaux", variant: "coral" },
  "Ingénierie": { label: "Ingénierie", variant: "blue" },
  Ingenierie: { label: "Ingénierie", variant: "blue" },
  Administration: { label: "Administration", variant: "gray" },
  "Ressources Humaines": { label: "Ressources Humaines", variant: "pink" },
  Direction: { label: "Direction", variant: "coral" },
};

export const SITE_MAP: Record<string, StatusEntry> = {
  siege: { label: "Siège", variant: "blue" },
  depot: { label: "Dépôt", variant: "amber" },
  chantier: { label: "Chantier", variant: "coral" },
  client: { label: "Client", variant: "gray" },
};

export const NIVEAU_HIERARCHIQUE_MAP: Record<string, StatusEntry> = {
  direction: { label: "Direction", variant: "coral" },
  encadrement: { label: "Encadrement", variant: "blue" },
  operationnel: { label: "Opérationnel", variant: "green" },
  support: { label: "Support", variant: "gray" },
};

// ─── PLANNING ───

export const EVENT_TYPE_MAP: Record<string, StatusEntry> = {
  reunion: { label: "Réunion", variant: "blue" },
  formation: { label: "Formation", variant: "teal" },
  visite_terrain: { label: "Visite terrain", variant: "coral" },
  visite_securite: { label: "Visite sécurité", variant: "red" },
  deadline: { label: "Deadline", variant: "red" },
  conge: { label: "Congé", variant: "amber" },
  chantier: { label: "Chantier", variant: "green" },
  livraison: { label: "Livraison", variant: "purple" },
  audit: { label: "Audit", variant: "teal" },
  autre: { label: "Autre", variant: "gray" },
};

export const REUNION_STATUS_MAP: Record<string, StatusEntry> = {
  planifiee: { label: "Planifiée", variant: "blue" },
  en_cours: { label: "En cours", variant: "amber" },
  terminee: { label: "Terminée", variant: "green" },
  annulee: { label: "Annulée", variant: "red" },
  reportee: { label: "Reportée", variant: "amber" },
};

// ─── FORMATIONS ───

export const FORMATION_STATUS_MAP: Record<string, StatusEntry> = {
  a_planifier: { label: "À planifier", variant: "gray" },
  inscrit: { label: "Inscrit", variant: "blue" },
  a_venir: { label: "À venir", variant: "blue" },
  en_cours: { label: "En cours", variant: "amber" },
  terminee: { label: "Terminée", variant: "green" },
  annulee: { label: "Annulée", variant: "red" },
  expiree: { label: "Expirée", variant: "red" },
};

export const FORMATION_CATEGORY_MAP: Record<string, StatusEntry> = {
  securite: { label: "Sécurité", variant: "red" },
  habilitation: { label: "Habilitation", variant: "coral" },
  technique: { label: "Technique", variant: "blue" },
  management: { label: "Management", variant: "purple" },
  reglementaire: { label: "Réglementaire", variant: "teal" },
  premiers_secours: { label: "Premiers secours", variant: "red" },
  autre: { label: "Autre", variant: "gray" },
};

export const CERTIFICATION_VALIDITY_MAP: Record<string, StatusEntry> = {
  valide: { label: "Valide", variant: "green" },
  expire_bientot: { label: "Expire bientôt", variant: "amber" },
  expiree: { label: "Expirée", variant: "red" },
  non_obtenue: { label: "Non obtenue", variant: "gray" },
};

// ─── RESSOURCES ───

export const DOCUMENT_TYPE_MAP: Record<string, StatusEntry> = {
  procedure: { label: "Procédure", variant: "teal" },
  formulaire: { label: "Formulaire", variant: "blue" },
  rapport: { label: "Rapport", variant: "purple" },
  note_service: { label: "Note de service", variant: "coral" },
  pv: { label: "PV", variant: "blue" },
  plan: { label: "Plan", variant: "green" },
  attestation: { label: "Attestation", variant: "teal" },
  modele: { label: "Modèle", variant: "gray" },
  autre: { label: "Autre", variant: "gray" },
};

export const DOCUMENT_STATUS_MAP: Record<string, StatusEntry> = {
  actif: { label: "Actif", variant: "green" },
  archive: { label: "Archivé", variant: "gray" },
  obsolete: { label: "Obsolète", variant: "red" },
};

export const ALBUM_TYPE_MAP: Record<string, StatusEntry> = {
  chantier: { label: "Chantier", variant: "coral" },
  evenement: { label: "Événement", variant: "pink" },
  equipe: { label: "Équipe", variant: "blue" },
  formation: { label: "Formation", variant: "teal" },
  visite: { label: "Visite", variant: "amber" },
  autre: { label: "Autre", variant: "gray" },
};

// ─── RH ───

export const CONGE_STATUS_MAP: Record<string, StatusEntry> = {
  en_attente: { label: "En attente", variant: "amber" },
  approuve: { label: "Approuvé", variant: "green" },
  refuse: { label: "Refusé", variant: "red" },
  annule: { label: "Annulé", variant: "gray" },
};

export const CONGE_TYPE_MAP: Record<string, StatusEntry> = {
  conge_paye: { label: "CP", variant: "blue" },
  rtt: { label: "RTT", variant: "purple" },
  maladie: { label: "Maladie", variant: "red" },
  sans_solde: { label: "Sans solde", variant: "gray" },
  formation: { label: "Formation", variant: "teal" },
  exceptionnel: { label: "Exceptionnel", variant: "pink" },
  maternite: { label: "Maternité", variant: "pink" },
  paternite: { label: "Paternité", variant: "blue" },
  accident_travail: { label: "AT", variant: "red" },
};

export const NOTE_FRAIS_STATUS_MAP: Record<string, StatusEntry> = {
  brouillon: { label: "Brouillon", variant: "gray" },
  soumise: { label: "Soumise", variant: "blue" },
  approuvee: { label: "Approuvée", variant: "green" },
  rejetee: { label: "Rejetée", variant: "red" },
  remboursee: { label: "Remboursée", variant: "green" },
};

export const DEPENSE_TYPE_MAP: Record<string, StatusEntry> = {
  deplacement: { label: "Déplacement", variant: "blue" },
  repas: { label: "Repas", variant: "amber" },
  hebergement: { label: "Hébergement", variant: "purple" },
  materiel: { label: "Matériel", variant: "green" },
  peage: { label: "Péage", variant: "gray" },
  carburant: { label: "Carburant", variant: "coral" },
  autre: { label: "Autre", variant: "gray" },
};

export const ENTRETIEN_STATUS_MAP: Record<string, StatusEntry> = {
  a_planifier: { label: "À planifier", variant: "gray" },
  planifie: { label: "Planifié", variant: "blue" },
  en_cours: { label: "En cours", variant: "amber" },
  termine: { label: "Terminé", variant: "green" },
  reporte: { label: "Reporté", variant: "amber" },
};

export const ENTRETIEN_TYPE_MAP: Record<string, StatusEntry> = {
  annuel: { label: "Annuel", variant: "blue" },
  professionnel: { label: "Professionnel", variant: "purple" },
  mi_parcours: { label: "Mi-parcours", variant: "amber" },
  fin_pe: { label: "Fin période essai", variant: "coral" },
};

export const CONTRAT_TYPE_MAP: Record<string, StatusEntry> = {
  cdi: { label: "CDI", variant: "green" },
  cdd: { label: "CDD", variant: "amber" },
  alternance: { label: "Alternance", variant: "blue" },
  stage: { label: "Stage", variant: "purple" },
  interim: { label: "Intérim", variant: "gray" },
};

// ─── SIGNATURE DE DOCUMENTS ───

export const SIGNATURE_STATUS_MAP: Record<string, StatusEntry> = {
  en_attente: { label: "En attente", variant: "amber" },
  urgent: { label: "Urgent", variant: "red" },
  signe: { label: "Signé", variant: "green" },
  refuse: { label: "Refusé", variant: "red" },
  expire: { label: "Expiré", variant: "gray" },
  en_cours: { label: "En cours", variant: "amber" },
};

// ─── TÂCHES ───

export const TASK_STATUS_MAP: Record<string, StatusEntry> = {
  a_faire: { label: "À faire", variant: "gray" },
  en_cours: { label: "En cours", variant: "amber" },
  en_revue: { label: "En revue", variant: "purple" },
  terminee: { label: "Terminée", variant: "green" },
  en_retard: { label: "En retard", variant: "red" },
  bloquee: { label: "Bloquée", variant: "red" },
};

export const PRIORITY_MAP: Record<string, StatusEntry> = {
  critique: { label: "Critique", variant: "red" },
  haute: { label: "Haute", variant: "coral" },
  moyenne: { label: "Moyenne", variant: "amber" },
  basse: { label: "Basse", variant: "gray" },
  // Legacy keys
  faible: { label: "Faible", variant: "gray" },
};

// ─── TIMEBIT ───

export const TIMEBIT_TYPE_MAP: Record<string, StatusEntry> = {
  chantier: { label: "Chantier", variant: "coral" },
  bureau: { label: "Bureau", variant: "blue" },
  deplacement: { label: "Déplacement", variant: "amber" },
  formation: { label: "Formation", variant: "teal" },
};

export const POINTAGE_STATUS_MAP: Record<string, StatusEntry> = {
  en_cours: { label: "En cours", variant: "green" },
  termine: { label: "Terminé", variant: "gray" },
  valide: { label: "Validé", variant: "teal" },
  a_corriger: { label: "À corriger", variant: "red" },
};

// ─── NOTIFICATIONS ───

export const NOTIFICATION_TYPE_MAP: Record<string, StatusEntry> = {
  info: { label: "Info", variant: "blue" },
  alerte: { label: "Alerte", variant: "red" },
  rappel: { label: "Rappel", variant: "amber" },
  validation: { label: "Validation", variant: "teal" },
  anniversaire: { label: "Anniversaire", variant: "pink" },
  mention: { label: "Mention", variant: "purple" },
  systeme: { label: "Système", variant: "gray" },
  // Legacy keys
  news: { label: "Actualité", variant: "blue" },
  event: { label: "Événement", variant: "blue" },
  birthday: { label: "Anniversaire", variant: "pink" },
  comment: { label: "Commentaire", variant: "purple" },
  conge: { label: "Congé", variant: "amber" },
  danger: { label: "Danger", variant: "red" },
  action_plan: { label: "Plan d'action", variant: "amber" },
  formation: { label: "Formation", variant: "teal" },
  system: { label: "Système", variant: "gray" },
};

// ─── ADMINISTRATION ───

export const USER_ACCOUNT_STATUS_MAP: Record<string, StatusEntry> = {
  actif: { label: "Actif", variant: "green" },
  desactive: { label: "Désactivé", variant: "gray" },
  en_attente: { label: "En attente", variant: "amber" },
  bloque: { label: "Bloqué", variant: "red" },
};

export const ACTIVITY_TYPE_MAP: Record<string, StatusEntry> = {
  creation: { label: "Création", variant: "green" },
  modification: { label: "Modification", variant: "blue" },
  suppression: { label: "Suppression", variant: "red" },
  connexion: { label: "Connexion", variant: "teal" },
  deconnexion: { label: "Déconnexion", variant: "gray" },
  export: { label: "Export", variant: "purple" },
  import: { label: "Import", variant: "amber" },
  signature: { label: "Signature", variant: "green" },
  // Legacy keys
  create_user: { label: "Création utilisateur", variant: "green" },
  update_user: { label: "Modification utilisateur", variant: "blue" },
  change_role: { label: "Changement de rôle", variant: "purple" },
  deactivate_user: { label: "Désactivation", variant: "red" },
  reactivate_user: { label: "Réactivation", variant: "green" },
  delete_user: { label: "Suppression", variant: "red" },
  promote_to_admin: { label: "Promotion admin", variant: "coral" },
};

// ─── PILIERS QSE (pour bonnes pratiques) ───

export const PILLAR_MAP: Record<string, StatusEntry> = {
  qualite: { label: "Qualité", variant: "amber" },
  sante: { label: "Santé", variant: "blue" },
  securite: { label: "Sécurité", variant: "red" },
  environnement: { label: "Environnement", variant: "green" },
};

// ─── PLAN D'ACTION TYPES ───

export const PLAN_ACTION_TYPE_MAP: Record<string, StatusEntry> = {
  corrective: { label: "Corrective", variant: "blue" },
  preventive: { label: "Préventive", variant: "purple" },
};

// ─── DANGER SEVERITY ───

export const DANGER_SEVERITY_MAP: Record<string, StatusEntry> = {
  "1": { label: "1 - Mineure", variant: "green" },
  "2": { label: "2 - Faible", variant: "amber" },
  "3": { label: "3 - Modérée", variant: "amber" },
  "4": { label: "4 - Grave", variant: "red" },
  "5": { label: "5 - Critique", variant: "red" },
};

// ─── resolveStatus() — Helper générique ───

export type StatusModule =
  | "articles"
  | "signalements"
  | "plans_actions"
  | "rex"
  | "taches"
  | "signatures"
  | "formations"
  | "conges"
  | "notes_frais"
  | "entretiens"
  | "collaborateurs"
  | "comptes"
  | "reunions"
  | "qse_docs"
  | "pointage";

const STATUS_MODULE_MAP: Record<StatusModule, Record<string, StatusEntry>> = {
  articles: ARTICLE_STATUS_MAP,
  signalements: SIGNALEMENT_STATUS_MAP,
  plans_actions: PLAN_ACTION_STATUS_MAP,
  rex: REX_STATUS_MAP,
  taches: TASK_STATUS_MAP,
  signatures: SIGNATURE_STATUS_MAP,
  formations: FORMATION_STATUS_MAP,
  conges: CONGE_STATUS_MAP,
  notes_frais: NOTE_FRAIS_STATUS_MAP,
  entretiens: ENTRETIEN_STATUS_MAP,
  collaborateurs: COLLABORATEUR_STATUS_MAP,
  comptes: USER_ACCOUNT_STATUS_MAP,
  reunions: REUNION_STATUS_MAP,
  qse_docs: QSE_DOC_STATUS_MAP,
  pointage: POINTAGE_STATUS_MAP,
};

export function resolveStatus(
  module: StatusModule,
  status: string
): StatusEntry {
  const map = STATUS_MODULE_MAP[module];
  if (map && map[status]) {
    return map[status];
  }
  return { label: status, variant: "gray" };
}

export function getStatusOptions(
  module: StatusModule
): { value: string; label: string }[] {
  const map = STATUS_MODULE_MAP[module];
  if (!map) return [];
  return Object.entries(map).map(([value, entry]) => ({
    value,
    label: entry.label,
  }));
}

// ─── Category module resolver ───

export type CategoryModule =
  | "articles"
  | "bonnes_pratiques"
  | "formations_cat"
  | "incidents"
  | "documents"
  | "equipes"
  | "piliers";

const CATEGORY_MODULE_MAP: Record<
  CategoryModule,
  Record<string, StatusEntry>
> = {
  articles: ARTICLE_CATEGORY_MAP,
  bonnes_pratiques: BONNE_PRATIQUE_CATEGORY_MAP,
  formations_cat: FORMATION_CATEGORY_MAP,
  incidents: INCIDENT_TYPE_MAP,
  documents: DOCUMENT_TYPE_MAP,
  equipes: EQUIPE_MAP,
  piliers: PILLAR_MAP,
};

export function resolveCategory(
  module: CategoryModule,
  category: string
): StatusEntry {
  const map = CATEGORY_MODULE_MAP[module];
  if (map && map[category]) {
    return map[category];
  }
  return { label: category, variant: "gray" };
}

export function getCategoryOptions(
  module: CategoryModule
): { value: string; label: string }[] {
  const map = CATEGORY_MODULE_MAP[module];
  if (!map) return [];
  return Object.entries(map).map(([value, entry]) => ({
    value,
    label: entry.label,
  }));
}

// ─── Type module resolver ───

export type TypeModule =
  | "evenements"
  | "vie_sociale"
  | "rex_types"
  | "conges_types"
  | "depenses"
  | "entretiens_types"
  | "albums"
  | "timebit"
  | "activites"
  | "notifications"
  | "plan_action_types";

const TYPE_MODULE_MAP: Record<TypeModule, Record<string, StatusEntry>> = {
  evenements: EVENT_TYPE_MAP,
  vie_sociale: VIE_SOCIALE_TYPE_MAP,
  rex_types: REX_TYPE_MAP,
  conges_types: CONGE_TYPE_MAP,
  depenses: DEPENSE_TYPE_MAP,
  entretiens_types: ENTRETIEN_TYPE_MAP,
  albums: ALBUM_TYPE_MAP,
  timebit: TIMEBIT_TYPE_MAP,
  activites: ACTIVITY_TYPE_MAP,
  notifications: NOTIFICATION_TYPE_MAP,
  plan_action_types: PLAN_ACTION_TYPE_MAP,
};

export function resolveType(
  module: TypeModule,
  type: string
): StatusEntry {
  const map = TYPE_MODULE_MAP[module];
  if (map && map[type]) {
    return map[type];
  }
  return { label: type, variant: "gray" };
}

export function getTypeOptions(
  module: TypeModule
): { value: string; label: string }[] {
  const map = TYPE_MODULE_MAP[module];
  if (!map) return [];
  return Object.entries(map).map(([value, entry]) => ({
    value,
    label: entry.label,
  }));
}
