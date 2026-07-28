/**
 * Fine calculation — mirrors Django's BorrowRecord._calculate_fine()
 */
import { prisma } from "./prisma";

export async function calculateFine(
    dueDate: Date,
    currentDate: Date = new Date()
): Promise<number> {
    const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
    const finePerDay = settings ? parseFloat(settings.finePerDay.toString()) : 2.0;

    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    const daysOverdue = Math.floor(
        (currentDate.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysOverdue > 0 ? daysOverdue * finePerDay : 0;
}

/** Update all overdue borrow records — mirrors management command update_overdue_books */
export async function updateOverdueBooks(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueBorrows = await prisma.borrowRecord.findMany({
        where: {
            status: "borrowed",
            dueDate: { lt: today },
        },
    });

    let updatedCount = 0;
    for (const record of overdueBorrows) {
        const fine = await calculateFine(record.dueDate, today);
        await prisma.borrowRecord.update({
            where: { id: record.id },
            data: {
                status: "overdue",
                fineAmount: fine,
            },
        });
        updatedCount++;
    }

    return updatedCount;
}
