import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isAdminProtectionEnabled, isValidAdminSecret } from "@/lib/admin";

async function reject(id: string, reason: string) {
  await requireAdmin();
  await prisma.game.updateMany({
    where: { id },
    data: {
      status: "REJECTED",
      rejectedReason: reason || "Needs improvement before approval.",
      reviewedAt: new Date(),
    },
  });
}

function getAdminFromUrl(req: Request) {
  return new URL(req.url).searchParams.get("admin");
}

async function getForm(req: Request) {
  return req.formData().catch(() => null);
}

function unauthorized(req: Request) {
  return NextResponse.redirect(new URL("/dashboard/review", req.url));
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const admin = getAdminFromUrl(req) || "";
  if (isAdminProtectionEnabled() && !isValidAdminSecret(admin)) {
    return unauthorized(req);
  }
  const { id } = await context.params;
  await reject(id, "Rejected by admin.");
  return NextResponse.redirect(new URL(`/dashboard/review${admin ? `?admin=${encodeURIComponent(admin)}` : ""}`, req.url));
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const formData = await getForm(req);
  const admin = String(formData?.get("admin") || getAdminFromUrl(req) || "");
  if (isAdminProtectionEnabled() && !isValidAdminSecret(admin)) {
    return unauthorized(req);
  }
  const reason = String(formData?.get("reason") || "Rejected by admin.");
  const { id } = await context.params;
  await reject(id, reason);
  return NextResponse.redirect(new URL(`/dashboard/review${admin ? `?admin=${encodeURIComponent(admin)}` : ""}`, req.url));
}
