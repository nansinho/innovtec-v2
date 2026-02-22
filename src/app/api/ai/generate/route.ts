import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const ROLE_CREDITS: Record<string, number> = {
  admin: 999999,
  rh: 100,
  responsable_qse: 100,
  chef_chantier: 50,
  technicien: 30,
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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Anthropic non configurée" },
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
