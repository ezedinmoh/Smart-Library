import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateOverdueBooks } from "@/lib/fines";
import type { SessionUser } from "@/types";

export async function POST() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const count = await updateOverdueBooks();
    return NextResponse.json({ success: true, count });
}
