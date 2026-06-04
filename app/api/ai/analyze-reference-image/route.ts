import { NextResponse } from "next/server";
import { z } from "zod";
import { fallbackReferenceAppearance, sanitizeReferenceAppearance } from "@/lib/ai/reference-image";
import { generateCharacterAssetSet } from "@/lib/ai/character-asset";

const schema = z.object({
  imageDataUrl: z.string().min(20).max(4_000_000).optional(),
  prompt: z.string().max(1500).optional(),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid reference image payload." }, { status: 400 });
    const { imageDataUrl, prompt = "" } = parsed.data;
    const fallback = fallbackReferenceAppearance(prompt);
    const apiKey = process.env.OPENAI_API_KEY?.trim();

    if (!imageDataUrl) {
      return NextResponse.json({ error: "Reference image is required for strict art asset generation." }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY is required. This route is strict and will not return fallback character art." }, { status: 500 });
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: process.env.OPENAI_VISION_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "Analyze the reference image for a game avatar. Return JSON only. Do not identify real people. Convert visual traits into a stylized Q/chibi game character schema, not a real-person identity.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: `Prompt: ${prompt}\nReturn this JSON shape: {"avatarStyle":"chibi|heroic|mech|creature|sprite","bodyType":"small|average|tall|heavy|tiny","skinColor":"#hex","hairStyle":"short|bob|long|spiky|twinTails|hood|helmet|cap|none","hairColor":"#hex","eyeColor":"#hex","outfitStyle":"combat|robe|armor|casual|school|spaceSuit|ninja|fantasy","outfitColor":"#hex","accessory":"visor|glasses|mask|cape|scarf|headphones|none","expression":"neutral|happy|angry|focused|surprised","referenceSummary":"short non-identifying visual summary"}` },
                { type: "image_url", image_url: { url: imageDataUrl } },
              ],
            },
          ],
        }),
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        return NextResponse.json({ error: `Vision analysis failed: ${response.status} ${text.slice(0, 220)}` }, { status: 502 });
      }

      const json = await response.json();
      const content = json.choices?.[0]?.message?.content;
      const analyzed = sanitizeReferenceAppearance(content ? JSON.parse(content) : {}, fallback);
      const assets = await generateCharacterAssetSet(analyzed, prompt);

      const appearance = {
        ...analyzed,
        ...assets,
        referenceImageUrl: imageDataUrl,
        referenceSummary: analyzed.referenceSummary,
      };

      return NextResponse.json({ appearance, source: "vision-model-plus-image-assets" });
    } catch (error) {
      console.error("Reference image analysis or asset generation failed:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Reference image analysis or character asset generation failed" },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Analyze reference image route failed:", error);
    return NextResponse.json({ error: "Analyze reference image failed" }, { status: 500 });
  }
}
