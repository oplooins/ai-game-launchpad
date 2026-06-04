import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { workflowTemplates } from "@/lib/workflow/templates";

export async function GET() {
  const workflows = await prisma.workflow.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
  return NextResponse.json({ templates: workflowTemplates, workflows });
}
