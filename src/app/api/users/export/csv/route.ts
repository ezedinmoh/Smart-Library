import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function GET() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await prisma.user.findMany({ include: { profile: true } });
    const rows = [["Username", "Email", "First Name", "Last Name", "Role", "Phone", "Address", "Active", "Joined", "Currently Borrowed", "Max Books", "Total Fines"]];
    for (const user of users) {
        rows.push([
            user.username, user.email, user.firstName, user.lastName,
            user.role, user.phoneNumber, user.address,
            user.isActive ? "Yes" : "No",
            new Date(user.dateJoined).toISOString().split("T")[0],
            String(user.profile?.currentlyBorrowed ?? 0),
            String(user.profile?.maxBooksAllowed ?? 7),
            parseFloat((user.profile?.totalFines ?? 0).toString()).toFixed(2),
        ]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment;filename="users_export.csv"` } });
}
