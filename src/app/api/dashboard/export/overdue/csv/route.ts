import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysOverdue } from "@/lib/utils";
import type { SessionUser } from "@/types";

export async function GET() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const records = await prisma.borrowRecord.findMany({ where: { status: "overdue" }, include: { user: true, book: true } });
    const rows = [["User", "Email", "Book", "ISBN", "Due Date", "Days Overdue", "Fine (ETB)", "Fine Paid"]];
    for (const r of records) {
        rows.push([
            r.user.username, r.user.email, r.book.title, r.book.isbn,
            new Date(r.dueDate).toISOString().split("T")[0],
            String(getDaysOverdue(r.dueDate)),
            parseFloat(r.fineAmount.toString()).toFixed(2),
            r.finePaid ? "Yes" : "No",
        ]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment;filename="overdue_books.csv"` } });
}
