import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function GET() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return new NextResponse("Forbidden", { status: 403 });

    const topBooks = await prisma.book.findMany({ where: { timesBorrowed: { gt: 0 } }, orderBy: { timesBorrowed: "desc" }, take: 10, include: { category: true } });
    
    let rowsHtml = "";
    let rank = 1;
    for (const b of topBooks) {
        rowsHtml += `<tr>
            <td style="text-align: center; font-weight: bold;">${rank++}</td>
            <td>${b.title}</td>
            <td>${b.author}</td>
            <td>${b.isbn}</td>
            <td>${b.category?.name || "—"}</td>
            <td style="text-align: right; font-weight: bold;">${b.timesBorrowed}</td>
        </tr>`;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Top 10 Borrowed Books</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            h1 { text-align: center; color: #111; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: 600; text-transform: uppercase; font-size: 12px; color: #6b7280; }
            .date { text-align: right; font-size: 12px; color: #6b7280; margin-bottom: 20px; }
        </style>
    </head>
    <body onload="window.print()">
        <h1>Top 10 Borrowed Books</h1>
        <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
        <table>
            <thead>
                <tr>
                    <th style="width: 40px; text-align: center;">Rank</th>
                    <th>Book Title</th>
                    <th>Author</th>
                    <th>ISBN</th>
                    <th>Category</th>
                    <th style="text-align: right;">Total Borrows</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml || "<tr><td colspan='6' style='text-align:center;'>No books borrowed yet.</td></tr>"}
            </tbody>
        </table>
    </body>
    </html>
    `;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
