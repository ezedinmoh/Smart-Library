import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const bookId = parseInt(id);
    const { action, amount } = await req.json();
    const qty = parseInt(amount) || 1;
    if (qty < 1) return NextResponse.json({ error: "Amount must be at least 1." }, { status: 400 });

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return NextResponse.json({ error: "Book not found." }, { status: 404 });

    let message = "";
    if (action === "add_copies") {
        await prisma.book.update({ where: { id: bookId }, data: { totalCopies: { increment: qty }, availableCopies: { increment: qty } } });
        message = `Added ${qty} cop${qty === 1 ? "y" : "ies"} to "${book.title}".`;
    } else if (action === "remove_copies") {
        if (qty > book.availableCopies) return NextResponse.json({ error: `Cannot remove ${qty} — only ${book.availableCopies} available.` }, { status: 400 });
        if (book.totalCopies - qty < 1) return NextResponse.json({ error: "Must keep at least 1 total copy." }, { status: 400 });
        await prisma.book.update({ where: { id: bookId }, data: { totalCopies: { decrement: qty }, availableCopies: { decrement: qty } } });
        message = `Removed ${qty} cop${qty === 1 ? "y" : "ies"} from "${book.title}".`;
    } else {
        return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
    return NextResponse.json({ success: true, message });
}
