import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isAdminProtectionEnabled, isValidAdminSecret } from "@/lib/admin";

async function approve(id: string) {
  await requireAdmin();
  await prisma.game.updateMany({
    where: { id },
    data: { status: "APPROVED", rejectedReason: null, reviewedAt: new Date() },
  });
}

function getAdminFromUrl(req: Request) {
  return new URL(req.url).searchParams.get("admin");
}

async function getAdminFromForm(req: Request) {
  const formData = await req.formData().catch(() => null);
  return String(formData?.get("admin") || getAdminFromUrl(req) || "");
}

function unauthorized(req: Request) {
  return NextResponse.redirect(new URL("/dashboard/review", req.url));
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  if (isAdminProtectionEnabled() && !isValidAdminSecret(getAdminFromUrl(req))) {
    return unauthorized(req);
  }
  const { id } = await context.params;
  await approve(id);
  return NextResponse.redirect(new URL(`/dashboard/review${getAdminFromUrl(req) ? `?admin=${encodeURIComponent(getAdminFromUrl(req) || "")}` : ""}`, req.url));
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const admin = await getAdminFromForm(req);
  if (isAdminProtectionEnabled() && !isValidAdminSecret(admin)) {
    return unauthorized(req);
  }
  const { id } = await context.params;
  await approve(id);
  return NextResponse.redirect(new URL(`/dashboard/review${admin ? `?admin=${encodeURIComponent(admin)}` : ""}`, req.url));
}
