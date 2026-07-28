import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDaysOverdue } from "@/lib/utils";
import type { SessionUser } from "@/types";

export async function GET() {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || (u.role !== "admin" && u.role !== "librarian")) return new NextResponse("Forbidden", { status: 403 });

    const records = await prisma.borrowRecord.findMany({ where: { status: "overdue" }, include: { user: true, book: true } });
    
    let rowsHtml = "";
    for (const r of records) {
        rowsHtml += `<tr>
            <td>${r.user.username}</td>
            <td>${r.user.email}</td>
            <td>${r.book.title}</td>
            <td>${new Date(r.dueDate).toISOString().split("T")[0]}</td>
            <td>${getDaysOverdue(r.dueDate)}</td>
            <td>ETB ${parseFloat(r.fineAmount.toString()).toFixed(2)}</td>
            <td>${r.finePaid ? "Yes" : "No"}</td>
        </tr>`;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Overdue Books Report</title>
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
        <h1>Overdue Books Report</h1>
        <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
        <table>
            <thead>
                <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Book</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                    <th>Fine</th>
                    <th>Paid?</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml || "<tr><td colspan='7' style='text-align:center;'>No overdue books.</td></tr>"}
            </tbody>
        </table>
    </body>
    </html>
    `;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
