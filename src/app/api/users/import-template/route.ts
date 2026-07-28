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
        "username", "email", "password", "role", 
        "first_name", "last_name", "phone_number"
    ];

    const sampleRow = {
        username: "johndoe",
        email: "john@example.com",
        password: "TempPassword123!",
        role: "student",
        first_name: "John",
        last_name: "Doe",
        phone_number: "+1234567890"
    };

    const worksheet = utils.json_to_sheet([sampleRow], { header: headers });
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Users");

    if (format === "excel") {
        const buf = write(workbook, { type: "buffer", bookType: "xlsx" });
        return new NextResponse(buf, {
            headers: {
                "Content-Disposition": 'attachment; filename="users_import_template.xlsx"',
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }
        });
    } else {
        // Default to CSV
        const csv = utils.sheet_to_csv(worksheet);
        return new NextResponse(csv, {
            headers: {
                "Content-Disposition": 'attachment; filename="users_import_template.csv"',
                "Content-Type": "text/csv",
            }
        });
    }
}
