import { prisma } from "@/lib/prisma";

export type AppRole = "PLAYER" | "DEVELOPER" | "ADMIN";

// Clerk-ready adapter.
// Current local MVP uses demo users so the platform is runnable without Clerk keys.
// Later, replace this with Clerk auth() + currentUser() and map Clerk user id to User.clerkId.
export async function getCurrentUser(role: AppRole = "DEVELOPER") {
  const email =
    role === "ADMIN"
      ? "admin@launchpad.local"
      : role === "PLAYER"
        ? "player@launchpad.local"
        : "developer@launchpad.local";

  return prisma.user.upsert({
    where: { email },
    update: { role, username: role === "ADMIN" ? "Demo Admin" : role === "PLAYER" ? "Demo Player" : "Demo Developer" },
    create: {
      email,
      username: role === "ADMIN" ? "Demo Admin" : role === "PLAYER" ? "Demo Player" : "Demo Developer",
      role,
    },
  });
}

export async function requireAdmin() {
  return getCurrentUser("ADMIN");
}

export async function requireDeveloper() {
  return getCurrentUser("DEVELOPER");
}

export async function requirePlayer() {
  return getCurrentUser("PLAYER");
}
