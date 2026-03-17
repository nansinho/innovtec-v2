import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicApiKey } from "@/actions/settings";

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

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profil introuvable" }, { status: 403 });
    }

    // Check credits
    const period = new Date().toISOString().slice(0, 7);
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
        { error: "Crédits IA épuisés pour ce mois" },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const prompt = formData.get("prompt") as string;
    const type = formData.get("type") as string;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    const apiKey = await getAnthropicApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Anthropic non configurée. Rendez-vous dans Paramètres pour la configurer." },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Convert file to base64
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Determine media type
    const mimeType = file.type;
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf";

    if (!isImage && !isPdf) {
      return NextResponse.json(
        { error: "Seuls les images (PNG, JPG) et les PDF sont acceptés" },
        { status: 400 }
      );
    }

    let systemPrompt =
      "Tu es un assistant IA pour l'intranet d'INNOVTEC Réseaux. Tu analyses des documents et images pour en extraire du contenu structuré. Réponds toujours en français.";

    if (type === "sse_dashboard") {
      systemPrompt = `Tu es un assistant IA spécialisé dans les tableaux de bord SSE (Santé-Sécurité-Environnement) pour INNOVTEC Réseaux.
Analyse ce document (image ou PDF) d'un tableau de bord SSE et extrais TOUTES les données vers le format JSON suivant.
Utilise 0 si une donnée n'est pas visible ou lisible.

IMPORTANT:
1. Le document contient deux tableaux :
   - Tableau de gauche "Indicateurs" avec les colonnes : Indicateur | Réalisé | Objectif
   - Tableau de droite "Indicateurs de suivi" avec les colonnes : Indicateur | Objectif | Réalisé
   Ne confonds pas les colonnes Objectif et Réalisé.
2. Tous les textes (bilan mensuel, priorités, vigilances, focus, citation) DOIVENT utiliser les accents français corrects (é, è, ê, à, â, ç, î, ô, û, etc.). Corrige les fautes d'orthographe si nécessaire.
3. Les valeurs numériques doivent être des nombres (pas de chaînes). Utilise le point comme séparateur décimal (ex: 91.3, pas 91,3). Les pourcentages sont des nombres sans le symbole % (ex: 63 pour 63%).

Retourne UNIQUEMENT un JSON valide avec ces champs :
{
  "month": <numéro du mois 1-12>,
  "year": <année>,
  "accidents_with_leave": <nombre d'accidents avec arrêt (colonne Réalisé du tableau Indicateurs)>,
  "accidents_with_leave_objective": "<objectif ex: ≤2 (colonne Objectif du tableau Indicateurs)>",
  "regulatory_training_completion": <suivi formations réglementaires (colonne Réalisé du tableau Indicateurs)>,
  "regulatory_training_objective": "<objectif ex: > 95% (colonne Objectif du tableau Indicateurs)>",
  "regulatory_compliance_rate": <taux de conformité réglementaire (colonne Réalisé du tableau Indicateurs)>,
  "regulatory_compliance_objective": "<objectif ex: > 80 % (colonne Objectif du tableau Indicateurs)>",
  "periodic_verification_rate": <taux réalisation vérification périodique (colonne Réalisé du tableau Indicateurs)>,
  "periodic_verification_objective": "<objectif ex: > 95% (colonne Objectif du tableau Indicateurs)>",
  "waste_monitoring": <suivi des déchets en pourcentage (colonne Réalisé du tableau Indicateurs)>,
  "waste_monitoring_objective": "<objectif ex: > 95% (colonne Objectif du tableau Indicateurs)>",
  "sst_rate": <taux de SST (colonne Réalisé du tableau Indicateurs, nombre sans le symbole %)>,
  "sst_rate_objective": "<objectif ex: > 40 % (colonne Objectif du tableau Indicateurs)>",
  "downgraded_bins": <nombre de bennes déclassées (colonne Réalisé du tableau Indicateurs)>,
  "downgraded_bins_objective": <objectif nombre (colonne Objectif du tableau Indicateurs)>,
  "accidents_without_leave_objective": <objectif nombre (colonne Objectif du tableau Indicateurs de suivi)>,
  "accidents_without_leave": <nombre d'accidents sans arrêt (colonne Réalisé du tableau Indicateurs de suivi)>,
  "cross_visits_objective": "<objectif ou -- (colonne Objectif du tableau Indicateurs de suivi)>",
  "cross_visits": <nombre de visites croisées (colonne Réalisé du tableau Indicateurs de suivi)>,
  "managerial_visits_objective": <objectif nombre (colonne Objectif du tableau Indicateurs de suivi)>,
  "managerial_visits": <nombre de visites managériales (colonne Réalisé du tableau Indicateurs de suivi)>,
  "sd_declarants_objective": <objectif décimal (colonne Objectif du tableau Indicateurs de suivi)>,
  "sd_declarants_percentage": <pourcentage de déclarants SD (colonne Réalisé du tableau Indicateurs de suivi)>,
  "sd_declared_objective": <objectif nombre (colonne Objectif du tableau Indicateurs de suivi)>,
  "sd_declared_count": <nombre de SD déclarés (colonne Réalisé du tableau Indicateurs de suivi)>,
  "waste_awareness_objective": "<objectif ou -- (colonne Objectif du tableau Indicateurs de suivi)>",
  "waste_awareness_employees": <nombre salariés sensibilisés tri déchets (colonne Réalisé du tableau Indicateurs de suivi)>,
  "training_plan_objective": "<objectif ex: 100% (colonne Objectif du tableau Indicateurs de suivi)>",
  "training_plan_follow_rate": <taux suivi plan de formation (colonne Réalisé du tableau Indicateurs de suivi)>,
  "field_visits_count": <nombre de visites terrain>,
  "monthly_report": "<texte du bilan mensuel>",
  "action_priorities": ["priorité 1", "priorité 2"],
  "vigilance_points": ["point 1", "point 2"],
  "focus_event_title": "<titre du focus événement>",
  "focus_event_content": ["fait 1", "fait 2"],
  "quote": "Aucune urgence, aucune importance sont prioritaires sur la sécurité"
}

Retourne UNIQUEMENT du JSON valide, sans markdown, sans backticks.`;
    } else if (type === "bonne_pratique") {
      systemPrompt = `Tu es un assistant IA spécialisé dans l'analyse de documents de bonnes pratiques pour INNOVTEC Réseaux.
Analyse ce document et extrais les informations pour créer une fiche de bonne pratique structurée.

Le document peut contenir des informations sur :
- Le titre et la description de la bonne pratique
- Le domaine/pilier QSE concerné (qualité, santé, sécurité, environnement)
- La catégorie (ex: EPI, signalisation, procédures, etc.)
- Le niveau de difficulté de mise en œuvre
- La priorité de la bonne pratique
- Les impacts (coûts, environnement, sécurité)
- Le chantier ou contexte concerné

Retourne UNIQUEMENT un JSON valide avec ces champs :
{
  "title": "<titre concis de la bonne pratique>",
  "description": "<description en HTML avec des balises <p> pour chaque paragraphe, <ul>/<li> pour les listes, <strong> pour le gras, <em> pour l'italique. Respecte les sauts de ligne et la mise en forme du document original. Chaque idée ou section doit être dans son propre paragraphe <p>.>",
  "pillar": "<pilier QSE parmi: securite, qualite, sante, environnement>",
  "category": "<catégorie libre, ex: EPI, signalisation, procédures, manutention, etc.>",
  "chantier": "<nom du chantier si mentionné, sinon vide>",
  "difficulty": "<difficulté de mise en œuvre parmi: facile, moyenne, difficile>",
  "priority": "<priorité parmi: faible, moyenne, elevee>",
  "cost_impact": "<impact sur les coûts parmi: faible, moyen, eleve>",
  "environmental_impact": "<impact environnemental parmi: aucun, faible, moyen, eleve>",
  "safety_impact": "<impact sécurité parmi: aucun, faible, moyen, eleve>"
}

IMPORTANT:
- La description DOIT être en HTML. Utilise <p> pour chaque paragraphe, <ul>/<li> pour les listes, <strong> pour le gras. Ne mets JAMAIS tout le texte dans un seul bloc.
- Extrais le contenu en préservant le sens, la structure et la qualité du texte.
- Si une information n'est pas présente dans le document, déduis-la du contexte ou laisse vide.
- Utilise les accents français corrects.
- Retourne UNIQUEMENT du JSON valide, sans markdown, sans backticks.`;
    } else if (type === "rex") {
      systemPrompt = `Tu es un assistant IA expert dans l'analyse de fiches REX (Retour d'Expérience) pour INNOVTEC Réseaux, entreprise de BTP spécialisée dans les réseaux.
Analyse cette fiche REX avec une EXTRÊME PRÉCISION et extrais TOUTES les informations structurées.

STRUCTURE D'UNE FICHE REX INNOVTEC :
1. HEADER : badge orange "FICHE REX N/ANNÉE", titre de l'événement, lieu, date (format JJ/MM/AAAA), horaire
2. Section "LES FAITS" (badge bleu avec engrenages) : description factuelle de ce qui s'est passé. Le texte est dans un encadré. Une photo peut accompagner à droite.
3. Section "LES CAUSES ET LES CIRCONSTANCES" (badge vert avec point d'interrogation) : analyse des causes racines. Le texte est dans un encadré. Une photo peut accompagner.
4. Section "LA SYNTHÈSE DES ACTIONS ENGAGÉES" (badge orange avec checklist) : mesures correctives prises. Le texte est dans un encadré. Une photo peut accompagner.
5. Section "LE RAPPEL À VIGILANCE" (badge jaune avec triangle attention) : rappels et consignes de sécurité. Le texte est dans un encadré. Un badge "RÈGLE VITALE" peut accompagner.
6. FOOTER : "DÉJÀ ARRIVÉ ?" avec liste de précédents similaires, et "TYPE D'ÉVÉNEMENT" où un type est mis en surbrillance parmi SD, PRESQU'ACCIDENT, ACCIDENT, HPE.

Retourne UNIQUEMENT un JSON valide avec ces champs :
{
  "rex_number": "<numéro exact de la fiche, ex: 2>",
  "rex_year": <année exacte, ex: 2025>,
  "title": "<titre EXACT tel qu'écrit après TITRE DE L'ÉVÉNEMENT>",
  "lieu": "<lieu EXACT tel qu'écrit>",
  "date_evenement": "<date convertie au format YYYY-MM-DD, ex: 2025-02-10 pour 10/02/2025>",
  "horaire": "<horaire EXACT, ex: 08h>",
  "faits": "<texte COMPLET et EXACT de la section Les Faits, en préservant chaque phrase et saut de ligne avec \\n>",
  "causes": "<texte COMPLET et EXACT de la section Les Causes, en préservant chaque phrase et saut de ligne avec \\n>",
  "actions_engagees": "<texte COMPLET et EXACT de la section Actions Engagées, en préservant chaque phrase et saut de ligne avec \\n>",
  "vigilance": "<texte COMPLET et EXACT de la section Rappel à Vigilance, en préservant chaque phrase et saut de ligne avec \\n>",
  "deja_arrive": ["<précédent 1>", "<précédent 2>"],
  "type_evenement": "<sd|presquaccident|accident|hpe — celui qui est en SURBRILLANCE ou encadré dans le footer>",
  "description": "<résumé clair en 1-2 phrases de ce qui s'est passé>",
  "lessons_learned": "<principales leçons tirées de cet événement>",
  "chantier": "<nom du chantier ou référence si mentionné, sinon chaîne vide>",
  "images_detected": <nombre d'images/photos visibles dans le document (hors icônes et logos)>
}

RÈGLES CRITIQUES :
1. Extrais le contenu EXACT mot pour mot de chaque section — ne résume JAMAIS, ne reformule JAMAIS.
2. Préserve les sauts de ligne entre les phrases/paragraphes avec \\n.
3. Pour la date, CONVERTIS toujours du format français JJ/MM/AAAA vers YYYY-MM-DD.
4. Pour type_evenement, identifie le type qui est visuellement SÉLECTIONNÉ (fond coloré, surligné, encadré) dans le footer. Ne devine pas.
5. Pour deja_arrive, extrais TOUS les points listés. Si la section contient "Non..." ou est vague, retourne le texte exact.
6. Le rex_number et rex_year sont dans le badge orange "FICHE REX" en haut.
7. Compte le nombre de VRAIES photos/images dans le document (pas les icônes, badges ou logos).
8. Utilise les accents français corrects (é, è, ê, à, ç, etc.).
9. Retourne UNIQUEMENT du JSON valide, sans markdown, sans backticks.`;
    } else if (type === "politique") {
      systemPrompt +=
        ` Analyse ce document de politique QSE et retourne un JSON avec ces champs:
- title: titre du document
- year: l'année du document (nombre entier, ex: 2025 ou 2026)
- date_signature: la date complète de signature au format YYYY-MM-DD (souvent en bas "Fait à ... le JJ/MM/AAAA")
- engagement_lieu: la ville mentionnée dans "Fait à [VILLE]" (ex: "Gardanne")
- engagement_text: le texte d'engagement de la direction (le paragraphe où la direction s'engage, souvent en bas du document avant la signature)
- signataires: tableau de noms des signataires du document (ex: ["Jean Dupont, Directeur Général"])
- sections: tableau d'objets {title, content}

IMPORTANT: Structure les sections EXACTEMENT selon les 4 piliers QSE avec engagements ET objectifs séparés:
- "Présentation générale" (le texte d'introduction du document)
- "QUALITÉ - Nos engagements" (les engagements qualité, chaque point sur une nouvelle ligne)
- "QUALITÉ - Nos objectifs" (les indicateurs/métriques qualité, chaque point sur une nouvelle ligne)
- "SANTÉ - Nos engagements" (les engagements santé)
- "SANTÉ - Nos objectifs" (les indicateurs/métriques santé)
- "SÉCURITÉ - Nos engagements" (les engagements sécurité)
- "SÉCURITÉ - Nos objectifs" (les indicateurs/métriques sécurité)
- "ENVIRONNEMENT - Nos engagements" (les engagements environnement)
- "ENVIRONNEMENT - Nos objectifs" (les indicateurs/métriques environnement)
Chaque point doit être sur sa propre ligne dans le champ content. Extrais TOUTES les informations du document.`;
    } else {
      systemPrompt +=
        " Analyse ce document et retourne un JSON structuré avec les informations pertinentes extraites.";
    }

    systemPrompt += " Retourne UNIQUEMENT du JSON valide, sans markdown, sans backticks.";

    const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

    if (isPdf) {
      contentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64,
        },
      });
    } else {
      contentBlocks.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
          data: base64,
        },
      });
    }

    contentBlocks.push({
      type: "text",
      text: prompt || "Analyse ce document et extrais les informations principales.",
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: contentBlocks }],
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

    let cleanedText = rawText.trim();
    // Strip markdown code blocks (```json ... ``` or ``` ... ```)
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch {
      parsed = { raw: rawText };
    }

    // Upload original file to Supabase storage with smart naming
    let fileUrl = "";
    const fileExt = file.name.split(".").pop() || (isPdf ? "pdf" : "png");

    // Smart file naming for REX: Fiche-REX-{number}-{year}.pdf
    let filePath: string;
    if (type === "rex" && parsed && parsed.rex_number && parsed.rex_year) {
      const safeNumber = String(parsed.rex_number).replace(/[^a-zA-Z0-9-]/g, "");
      const safeYear = String(parsed.rex_year).replace(/[^0-9]/g, "");
      filePath = `qse/rex/Fiche-REX-${safeNumber}-${safeYear}.${fileExt}`;
    } else {
      filePath = `qse/${type}/${Date.now()}-${randomUUID()}.${fileExt}`;
    }

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, Buffer.from(buffer), {
        contentType: mimeType,
        upsert: true,
      });

    if (!uploadError) {
      fileUrl = filePath;
    }

    return NextResponse.json({
      result: parsed,
      fileUrl,
      imagesDetected: parsed?.images_detected || 0,
      credits_remaining: credit
        ? credit.credits_limit - credit.credits_used - 1
        : 0,
    });
  } catch (error) {
    console.error("AI analyze-file error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du fichier" },
      { status: 500 }
    );
  }
}
