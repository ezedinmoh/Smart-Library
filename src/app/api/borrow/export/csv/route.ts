import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function GET() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const records = await prisma.borrowRecord.findMany({
        include: { user: true, book: true, issuedBy: true, returnedTo: true },
    });

    const rows = [["User", "Book Title", "Author", "ISBN", "Borrow Date", "Due Date", "Return Date", "Status", "Fine Amount", "Fine Paid", "Issued By", "Returned To"]];
    for (const r of records) {
        rows.push([
            r.user.username, r.book.title, r.book.author, r.book.isbn,
            new Date(r.borrowDate).toISOString().split("T")[0],
            new Date(r.dueDate).toISOString().split("T")[0],
            r.returnDate ? new Date(r.returnDate).toISOString().split("T")[0] : "",
            r.status,
            parseFloat(r.fineAmount.toString()).toFixed(2),
            r.finePaid ? "Yes" : "No",
            r.issuedBy?.username ?? "",
            r.returnedTo?.username ?? "",
        ]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment;filename="borrow_records.csv"` } });
}
