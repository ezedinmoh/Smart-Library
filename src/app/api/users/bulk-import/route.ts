import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";
import { read, utils } from "xlsx";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No CSV/Excel file provided" }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[] = utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return NextResponse.json({ error: "The file is empty or formatted incorrectly." }, { status: 400 });
        }

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const username = String(row.username || "").trim();
            const email = String(row.email || "").trim();
            const password = String(row.password || "").trim();
            const role = String(row.role || "student").trim().toLowerCase();
            const rowNum = i + 2;

            if (!username || !email || !password) {
                skipped++;
                errors.push(`Row ${rowNum}: Missing required fields (username, email, password)`);
                continue;
            }

            try {
                const existingUser = await prisma.user.findFirst({
                    where: { OR: [{ username }, { email }] }
                });
                
                if (existingUser) {
                    skipped++;
                    errors.push(`Row ${rowNum}: User with username or email already exists`);
                    continue;
                }

                const hashedPassword = await bcrypt.hash(password, 10);
                
                await prisma.user.create({
                    data: {
                        username,
                        email,
                        password: hashedPassword,
                        role: ["admin", "librarian", "student"].includes(role) ? role : "student",
                        firstName: String(row.first_name || ""),
                        lastName: String(row.last_name || ""),
                        phoneNumber: String(row.phone_number || ""),
                        isActive: true,
                        isStaff: role === "librarian" || role === "admin",
                        isSuperuser: role === "admin"
                    }
                });
                imported++;
            } catch (err: any) {
                skipped++;
                errors.push(`Row ${rowNum}: Failed to import - ${err.message}`);
            }
        }

        await logActivity(parseInt(u.id), "bulk_import", `Bulk imported ${imported} users`);
        return NextResponse.json({ imported, skipped, errors });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Failed to process import: " + error.message }, { status: 500 });
    }
}
