export const dynamic = "force-dynamic";

import { Navbar } from "@/components/layout/Navbar";
import { requireDeveloper } from "@/lib/auth";

export default async function ProfilePage() {
  const user = await requireDeveloper();
  return <main className="page"><Navbar /><section className="section"><div className="container"><p className="eyebrow">Auth-ready Profile</p><h1 className="h1">Profile</h1><div className="card"><p>Email: {user.email}</p><p>Username: {user.username}</p><p>Role: {user.role}</p><p className="muted">This local MVP uses demo users. Replace lib/auth.ts with Clerk auth when deploying v0.3.</p></div></div></section></main>;
}
