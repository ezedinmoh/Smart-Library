import { requireAuth } from "@/lib/session";
import { redirect } from "next/navigation";

// /dashboard → redirect to role-specific dashboard
export default async function DashboardIndexPage() {
    const user = await requireAuth();
    if (user.role === "admin") redirect("/dashboard/admin");
    if (user.role === "librarian") redirect("/dashboard/librarian");
    redirect("/dashboard/student");
}
