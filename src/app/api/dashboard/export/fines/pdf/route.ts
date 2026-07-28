import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

export async function GET() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return new NextResponse("Forbidden", { status: 403 });

    const records = await prisma.borrowRecord.findMany({ where: { fineAmount: { gt: 0 } }, include: { user: true, book: true } });
    
    let rowsHtml = "";
    let totalFine = 0;
    
    for (const r of records) {
        const fine = parseFloat(r.fineAmount.toString());
        totalFine += fine;
        rowsHtml += `<tr>
            <td>${r.user.username}</td>
            <td>${r.book.title}</td>
            <td>${r.book.isbn}</td>
            <td>${r.status}</td>
            <td>ETB ${fine.toFixed(2)}</td>
            <td style="color: ${r.finePaid ? '#10b981' : '#ef4444'}">${r.finePaid ? "Paid" : "Unpaid"}</td>
        </tr>`;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Fines Report</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            h1 { text-align: center; color: #111; margin-bottom: 10px; }
            .subtitle { text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; }
            th { background-color: #f9fafb; font-weight: 600; text-transform: uppercase; font-size: 12px; color: #6b7280; }
            .date { text-align: right; font-size: 12px; color: #6b7280; margin-bottom: 20px; }
            .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; color: #111; }
        </style>
    </head>
    <body onload="window.print()">
        <h1>Fines Report</h1>
        <div class="subtitle">Library Fines Summary</div>
        <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
        <table>
            <thead>
                <tr>
                    <th>User</th>
                    <th>Book</th>
                    <th>ISBN</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th>Payment Status</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml || "<tr><td colspan='6' style='text-align:center;'>No fines recorded.</td></tr>"}
            </tbody>
        </table>
        <div class="total">Total Fines: ETB ${totalFine.toFixed(2)}</div>
    </body>
    </html>
    `;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
