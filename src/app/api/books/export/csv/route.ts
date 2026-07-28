import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function GET() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const books = await prisma.book.findMany({ include: { category: true } });
    const rows = [["ISBN", "Title", "Author", "Category", "Total Copies", "Available", "Publisher", "Language", "Times Borrowed", "Publication Date", "Pages", "Created At"]];
    for (const b of books) {
        rows.push([
            b.isbn, b.title, b.author,
            b.category?.name ?? "Uncategorized",
            String(b.totalCopies), String(b.availableCopies),
            b.publisher, b.language,
            String(b.timesBorrowed),
            b.publicationDate ? new Date(b.publicationDate).toISOString().split("T")[0] : "",
            String(b.pages ?? ""),
            new Date(b.createdAt).toISOString().split("T")[0],
        ]);
    }
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment;filename="books_export.csv"` } });
}
