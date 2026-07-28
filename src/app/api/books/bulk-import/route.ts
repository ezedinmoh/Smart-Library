import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import type { SessionUser } from "@/types";
import { read, utils } from "xlsx";
// import AdmZip from "adm-zip"; // Uncomment if adm-zip is successfully installed

export async function POST(req: Request) {
    const session = await auth();
    const u = session?.user as SessionUser | undefined;
    if (!u || u.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        // const zipFile = formData.get("zip_file") as File | null;

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
            const isbn = String(row.isbn || "").trim();
            const title = String(row.title || "").trim();
            const author = String(row.author || "").trim();
            const rowNum = i + 2;

            if (!isbn || !title || !author) {
                skipped++;
                errors.push(`Row ${rowNum}: Missing required fields (isbn, title, author)`);
                continue;
            }

            try {
                const existing = await prisma.book.findUnique({ where: { isbn } });
                if (existing) {
                    skipped++;
                    errors.push(`Row ${rowNum}: Book with ISBN ${isbn} already exists`);
                    continue;
                }

                let categoryId = null;
                if (row.category) {
                    let cat = await prisma.category.findUnique({ where: { name: String(row.category).trim() } });
                    if (!cat) {
                        cat = await prisma.category.create({ data: { name: String(row.category).trim() } });
                    }
                    categoryId = cat.id;
                }

                // If adm-zip is installed, process zipFile here to extract row.cover_filename or row.pdf_filename to Cloudinary/local storage

                await prisma.book.create({
                    data: {
                        isbn,
                        title,
                        author,
                        description: String(row.description || ""),
                        publisher: String(row.publisher || ""),
                        language: String(row.language || "English"),
                        pages: parseInt(row.pages) || 0,
                        publicationDate: row.publication_date ? new Date(row.publication_date) : null,
                        totalCopies: parseInt(row.total_copies) || 1,
                        availableCopies: parseInt(row.total_copies) || 1,
                        categoryId,
                        // coverImage: extractedCoverUrl,
                        // pdfFile: extractedPdfUrl,
                    }
                });
                imported++;
            } catch (err: any) {
                skipped++;
                errors.push(`Row ${rowNum}: Failed to import - ${err.message}`);
            }
        }

        await logActivity(parseInt(u.id), "bulk_import", `Bulk imported ${imported} books`);
        return NextResponse.json({ imported, skipped, errors });

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Failed to process import: " + error.message }, { status: 500 });
    }
}
