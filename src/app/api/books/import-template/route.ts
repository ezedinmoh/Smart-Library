import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { SessionUser } from "@/types";
import { utils, write } from "xlsx";

export async function GET(req: Request) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";

    const headers = [
        "isbn", "title", "author", "description", "category", 
        "publisher", "language", "pages", "publication_date", 
        "total_copies", "cover_filename", "pdf_filename"
    ];

    const sampleRow = {
        isbn: "978-0131103627",
        title: "The C Programming Language",
        author: "Brian W. Kernighan",
        description: "A classic book on C programming.",
        category: "Programming",
        publisher: "Prentice Hall",
        language: "English",
        pages: 274,
        publication_date: "1988-03-22",
        total_copies: 5,
        cover_filename: "c_programming.jpg",
        pdf_filename: "c_programming.pdf"
    };

    const worksheet = utils.json_to_sheet([sampleRow], { header: headers });
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Books");

    if (format === "excel") {
        const buf = write(workbook, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
            headers: {
                "Content-Disposition": 'attachment; filename="books_import_template.xlsx"',
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
        });
    } else {
        // Default to CSV
        const csv = utils.sheet_to_csv(worksheet);
        return new NextResponse(csv, {
            headers: {
                "Content-Disposition": 'attachment; filename="books_import_template.csv"',
                "Content-Type": "text/csv",
            }
        });
    }
}
