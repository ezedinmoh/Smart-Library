/**
 * Prisma seed — creates initial admin user + system settings + default categories
 * Run: pnpm db:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database…");

    // ── System Settings ───────────────────────────────────────────────────────
    await prisma.systemSettings.upsert({
        where: { id: 1 },
        create: { id: 1, defaultBorrowLimit: 5, finePerDay: 2.0, etbToUsdRate: 0.018, maxBorrowDays: 14 },
        update: {},
    });
    console.log("✅ System settings created");

    // ── Default Categories ────────────────────────────────────────────────────
    const categories = [
        "Technology", "Computer Science", "Science", "Mathematics",
        "Literature", "Fiction", "History", "Business", "Economics",
        "Psychology", "Philosophy", "Art & Design", "Medicine", "Law",
    ];
    for (const name of categories) {
        await prisma.category.upsert({ where: { name }, create: { name }, update: {} });
    }
    console.log(`✅ ${categories.length} categories created`);

    // ── Admin User ────────────────────────────────────────────────────────────
    const adminEmail = "admin@smartlibrary.com";
    const existing = await prisma.user.findFirst({ where: { email: adminEmail } });

    if (!existing) {
        const hashed = await bcrypt.hash("admin123456", 12);
        const admin = await prisma.user.create({
            data: {
                username: "admin",
                email: adminEmail,
                password: hashed,
                firstName: "System",
                lastName: "Admin",
                role: "admin",
                isActive: true,
                isSuperuser: true,
                isStaff: true,
            },
        });
        await prisma.userProfile.create({ data: { userId: admin.id, maxBooksAllowed: 10 } });
        await prisma.emailAddress.create({ data: { userId: admin.id, email: adminEmail, verified: true, primary: true } });
        console.log("✅ Admin user created: admin@smartlibrary.com / admin123456");
        console.log("⚠️  CHANGE THE ADMIN PASSWORD IMMEDIATELY after first login!");
    } else {
        console.log("ℹ️  Admin user already exists, skipping.");
    }

    // ── Demo Librarian ────────────────────────────────────────────────────────
    const libEmail = "librarian@smartlibrary.com";
    const existingLib = await prisma.user.findFirst({ where: { email: libEmail } });
    if (!existingLib) {
        const hashed = await bcrypt.hash("librarian123", 12);
        const lib = await prisma.user.create({
            data: { username: "librarian", email: libEmail, password: hashed, firstName: "Demo", lastName: "Librarian", role: "librarian", isActive: true },
        });
        await prisma.userProfile.create({ data: { userId: lib.id } });
        await prisma.emailAddress.create({ data: { userId: lib.id, email: libEmail, verified: true, primary: true } });
        console.log("✅ Demo librarian: librarian@smartlibrary.com / librarian123");
    }

    // ── Demo Student ──────────────────────────────────────────────────────────
    const studEmail = "student@smartlibrary.com";
    const existingStud = await prisma.user.findFirst({ where: { email: studEmail } });
    if (!existingStud) {
        const hashed = await bcrypt.hash("student123", 12);
        const stud = await prisma.user.create({
            data: { username: "student", email: studEmail, password: hashed, firstName: "Demo", lastName: "Student", role: "student", isActive: true },
        });
        await prisma.userProfile.create({ data: { userId: stud.id } });
        await prisma.emailAddress.create({ data: { userId: stud.id, email: studEmail, verified: true, primary: true } });
        console.log("✅ Demo student: student@smartlibrary.com / student123");
    }

    console.log("\n🎉 Seed complete!");
    console.log("─────────────────────────────────────────");
    console.log("Admin:     admin@smartlibrary.com     / admin123456");
    console.log("Librarian: librarian@smartlibrary.com / librarian123");
    console.log("Student:   student@smartlibrary.com   / student123");
    console.log("─────────────────────────────────────────");
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
