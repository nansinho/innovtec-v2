import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicApiKey } from "@/actions/settings";
import { checkRateLimit } from "@/lib/rate-limit";

const ROLE_CREDITS: Record<string, number> = {
  admin: 999999,
  rh: 100,
  responsable_qse: 100,
  chef_chantier: 50,
  technicien: 30,
  collaborateur: 30,
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Rate limit: 10 requests per minute per user
    const { success: rateLimitOk } = checkRateLimit(
      `aiGenerate:${user.id}`,
      10,
      60_000
    );
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: "Trop de tentatives. Réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    // Get user profile for role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });
    }

    // Check/create credits for current period
    const period = new Date().toISOString().slice(0, 7); // "2026-02"
    const creditLimit = ROLE_CREDITS[profile.role] ?? 30;

    let { data: credit } = await supabase
      .from("ai_credits")
      .select("*")
      .eq("user_id", user.id)
      .eq("period", period)
      .single();

    if (!credit) {
      const { data: newCredit } = await supabase
        .from("ai_credits")
        .insert({
          user_id: user.id,
          credits_used: 0,
          credits_limit: creditLimit,
          period,
        })
        .select("*")
        .single();
      credit = newCredit;
    }

    if (credit && credit.credits_used >= credit.credits_limit) {
      return NextResponse.json(
        {
          error: "Crédits IA épuisés pour ce mois",
          credits_used: credit.credits_used,
          credits_limit: credit.credits_limit,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { prompt, context, type } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    const apiKey = await getAnthropicApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Anthropic non configurée. Rendez-vous dans Paramètres pour la configurer." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Build system prompt based on type
    let systemPrompt = "Tu es un assistant IA pour l'intranet d'INNOVTEC Réseaux, une entreprise de construction de réseaux. Réponds toujours en français.";

    if (type === "news") {
      systemPrompt +=
        " Tu génères des actualités d'entreprise. Retourne un JSON avec les champs: title, excerpt (2 phrases max), content (paragraphes détaillés), category (une valeur parmi: entreprise, securite, formation, chantier, social, rh), priority (normal, important, ou urgent).";
    } else if (type === "danger") {
      systemPrompt +=
        " Tu génères des rapports de situations dangereuses sur les chantiers. Retourne un JSON avec les champs: title, description (détaillée et professionnelle), location (lieu suggéré si mentionné, sinon vide), severity (1 à 5, 5 étant le plus grave).";
    } else if (type === "rex") {
      systemPrompt +=
        " Tu génères des retours d'expérience (REX) de chantiers. Retourne un JSON avec les champs: title, description (contexte et déroulement), lessons_learned (leçons tirées, points d'amélioration), chantier (nom du chantier si mentionné).";
    } else if (type === "politique") {
      systemPrompt +=
        " Tu génères du contenu structuré pour la politique QSE (Qualité, Sécurité, Environnement). Retourne un JSON avec les champs: title, sections (tableau d'objets {title, content} représentant les sections du document).";
    } else if (type === "bonne_pratique") {
      systemPrompt +=
        ` Tu génères des fiches de bonnes pratiques pour les chantiers de construction de réseaux. Retourne un JSON avec les champs: title (titre concis), description (description détaillée en HTML avec des balises <p> pour chaque paragraphe, <ul>/<li> pour les listes, <strong> pour le gras — chaque idée dans son propre paragraphe, jamais tout en un seul bloc), pillar (pilier QSE parmi: securite, qualite, sante, environnement), category (catégorie libre ex: EPI, signalisation, procédures), chantier (nom du chantier si mentionné, sinon vide), difficulty (difficulté parmi: facile, moyenne, difficile), priority (priorité parmi: faible, moyenne, elevee), cost_impact (impact coûts parmi: faible, moyen, eleve), environmental_impact (impact environnemental parmi: aucun, faible, moyen, eleve), safety_impact (impact sécurité parmi: aucun, faible, moyen, eleve).`;
    } else if (type === "sse_dashboard") {
      systemPrompt = `Tu es un assistant IA specialise dans les tableaux de bord SSE (Sante-Securite-Environnement) pour INNOVTEC Reseaux.
A partir du texte fourni par l'utilisateur (qui peut etre un copier-coller de donnees, un rapport, ou une description), tu dois extraire et mapper les donnees vers le format JSON suivant.

Retourne UNIQUEMENT un JSON valide avec ces champs (utilise 0 si la donnee n'est pas trouvee) :
{
  "month": <numero du mois 1-12>,
  "year": <annee>,
  "accidents_with_leave": <nombre d'accidents avec arret>,
  "accidents_with_leave_objective": "<objectif ex: ≤2>",
  "regulatory_training_completion": <suivi formations reglementaires, nombre ou pourcentage>,
  "regulatory_training_objective": "<objectif ex: > 95%>",
  "regulatory_compliance_rate": <taux de conformite reglementaire>,
  "regulatory_compliance_objective": "<objectif ex: > 80 %>",
  "periodic_verification_rate": <taux de realisation verification periodique>,
  "periodic_verification_objective": "<objectif ex: > 95%>",
  "waste_monitoring": <suivi des dechets en pourcentage>,
  "waste_monitoring_objective": "<objectif ex: > 95%>",
  "sst_rate": <taux de SST en pourcentage>,
  "sst_rate_objective": "<objectif ex: > 40 %>",
  "downgraded_bins": <nombre de bennes declassees>,
  "downgraded_bins_objective": <objectif nombre>,
  "accidents_without_leave": <nombre d'accidents sans arret>,
  "accidents_without_leave_objective": <objectif nombre>,
  "cross_visits": <nombre de visites croisees>,
  "cross_visits_objective": "<objectif ou -->",
  "managerial_visits": <nombre de visites manageriales>,
  "managerial_visits_objective": <objectif nombre>,
  "sd_declarants_percentage": <pourcentage de declarants SD>,
  "sd_declarants_objective": <objectif decimal>,
  "sd_declared_count": <nombre de SD declares>,
  "sd_declared_objective": <objectif nombre>,
  "waste_awareness_employees": <nombre de salaries sensibilises tri dechets>,
  "waste_awareness_objective": "<objectif ou -->",
  "training_plan_follow_rate": <taux de suivi plan de formation>,
  "training_plan_objective": "<objectif ex: 100%>",
  "field_visits_count": <nombre de visites terrain>,
  "monthly_report": "<texte du bilan mensuel>",
  "action_priorities": ["priorite 1", "priorite 2"],
  "vigilance_points": ["point 1", "point 2"],
  "focus_event_title": "<titre du focus evenement>",
  "focus_event_content": ["fait 1", "fait 2"],
  "quote": "Aucune urgence, aucune importance sont prioritaires sur la securite"
}

Retourne UNIQUEMENT du JSON valide, sans markdown, sans backticks.`;
    }

    systemPrompt += " Retourne UNIQUEMENT du JSON valide, sans markdown, sans backticks, sans texte avant ou après.";

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: context
            ? `Contexte supplémentaire: ${context}\n\nDemande: ${prompt}`
            : prompt,
        },
      ],
    });

    // Deduct credit
    if (credit) {
      await supabase
        .from("ai_credits")
        .update({ credits_used: credit.credits_used + 1 })
        .eq("id", credit.id);
    }

    const textContent = message.content.find((c) => c.type === "text");
    const rawText = textContent ? textContent.text : "";

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }

    return NextResponse.json({
      result: parsed,
      credits_remaining: credit
        ? credit.credits_limit - credit.credits_used - 1
        : 0,
    });
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération IA" },
      { status: 500 }
    );
  }
}
