import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { deleteNotification } from "@/lib/notifications";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest) {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { key, type } = await req.json();
    const success = await deleteNotification(parseInt(user.id), key, type);
    return NextResponse.json({ success });
}
