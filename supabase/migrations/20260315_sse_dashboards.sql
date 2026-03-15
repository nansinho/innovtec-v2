-- Tableau de bord SSE mensuel
CREATE TABLE IF NOT EXISTS sse_dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Periode
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,

  -- Indicateurs principaux (Realise + Objectif)
  accidents_with_leave INTEGER DEFAULT 0,
  accidents_with_leave_objective TEXT DEFAULT '≤2',
  regulatory_training_completion NUMERIC(5,1) DEFAULT 0,
  regulatory_training_objective TEXT DEFAULT '> 95%',
  regulatory_compliance_rate NUMERIC(5,1) DEFAULT 0,
  regulatory_compliance_objective TEXT DEFAULT '> 80 %',
  periodic_verification_rate NUMERIC(5,1) DEFAULT 0,
  periodic_verification_objective TEXT DEFAULT '> 95%',
  waste_monitoring NUMERIC(5,1) DEFAULT 0,
  waste_monitoring_objective TEXT DEFAULT '> 95%',
  sst_rate NUMERIC(5,1) DEFAULT 0,
  sst_rate_objective TEXT DEFAULT '> 40 %',
  downgraded_bins INTEGER DEFAULT 0,
  downgraded_bins_objective INTEGER DEFAULT 0,

  -- Indicateurs de suivi (Objectif + Realise)
  accidents_without_leave INTEGER DEFAULT 0,
  accidents_without_leave_objective INTEGER DEFAULT 0,
  cross_visits INTEGER DEFAULT 0,
  cross_visits_objective TEXT DEFAULT '--',
  managerial_visits INTEGER DEFAULT 0,
  managerial_visits_objective INTEGER DEFAULT 8,
  sd_declarants_percentage NUMERIC(5,2) DEFAULT 0,
  sd_declarants_objective NUMERIC(5,2) DEFAULT 0.12,
  sd_declared_count INTEGER DEFAULT 0,
  sd_declared_objective INTEGER DEFAULT 6,
  waste_awareness_employees INTEGER DEFAULT 0,
  waste_awareness_objective TEXT DEFAULT '--',
  training_plan_follow_rate NUMERIC(5,1) DEFAULT 0,
  training_plan_objective TEXT DEFAULT '100%',

  -- Sections textuelles
  field_visits_count INTEGER DEFAULT 0,
  monthly_report TEXT DEFAULT '',
  action_priorities TEXT[] DEFAULT '{}',
  vigilance_points TEXT[] DEFAULT '{}',
  focus_event_title TEXT DEFAULT 'Accident avec arrêt',
  focus_event_content TEXT[] DEFAULT '{}',

  -- Citation
  quote TEXT DEFAULT 'Aucune urgence, aucune importance sont prioritaires sur la sécurité',

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(month, year)
);

ALTER TABLE sse_dashboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sse_dashboards_select" ON sse_dashboards
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "sse_dashboards_insert" ON sse_dashboards
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'responsable_qse')
    )
  );

CREATE POLICY "sse_dashboards_update" ON sse_dashboards
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'responsable_qse')
    )
  );

CREATE POLICY "sse_dashboards_delete" ON sse_dashboards
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'responsable_qse')
    )
  );
