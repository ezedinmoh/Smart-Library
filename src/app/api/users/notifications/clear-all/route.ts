import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clearAllNotifications } from "@/lib/notifications";
import type { SessionUser } from "@/types";

export async function POST() {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const count = await clearAllNotifications(parseInt(user.id));
    return NextResponse.json({ success: true, count });
}
