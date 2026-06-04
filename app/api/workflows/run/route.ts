import { NextResponse } from "next/server";
import { z } from "zod";
import { runWorkflow } from "@/lib/workflow/run";
import { consumeGeneration } from "@/lib/usage";

const schema = z.object({
  templateId: z.string().min(2),
  prompt: z.string().min(10).max(2000),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Prompt must be 10-2000 characters.", details: parsed.error.flatten() }, { status: 400 });
    }

    const usage = await consumeGeneration({ req, type: "playable-game" });
    if (!usage.ok) {
      return NextResponse.json({ error: usage.message, usage }, { status: 429 });
    }

    const result = await runWorkflow(parsed.data);

    return NextResponse.json({
      ok: true,
      game: result.game,
      workflow: result.workflow,
      run: result.workflowRun,
      usage,
      redirectTo: `/editor/${result.game.slug}`,
    });
  } catch (error) {
    console.error("Workflow run failed:", error);
    return NextResponse.json({ error: "Workflow run failed" }, { status: 500 });
  }
}
