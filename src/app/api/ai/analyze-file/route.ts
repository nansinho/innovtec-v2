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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Clé API Anthropic non configurée" },
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

    if (type === "politique") {
      systemPrompt +=
        " Analyse ce document de politique QSE et retourne un JSON avec: title (titre du document), sections (tableau d'objets {title, content} représentant chaque section/chapitre du document). Extrais toutes les informations importantes: engagements, objectifs, mesures, responsabilités.";
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
    console.error("AI analyze-file error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du fichier" },
      { status: 500 }
    );
  }
}
