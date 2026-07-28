import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = parseInt(session.user.id);
        const recordId = parseInt(params.id);

        if (isNaN(recordId)) {
            return NextResponse.json({ error: "Invalid record ID" }, { status: 400 });
        }

        const borrowRecord = await prisma.borrowRecord.findUnique({
            where: { id: recordId },
            include: { book: true },
        });

        if (!borrowRecord || borrowRecord.userId !== userId) {
            return NextResponse.json({ error: "Borrow record not found" }, { status: 404 });
        }

        if (borrowRecord.status === "overdue") {
            return NextResponse.json(
                { error: "Overdue books cannot be renewed online. Please visit the library counter." },
                { status: 400 }
            );
        }

        // Extend due date by 14 days
        const currentDueDate = new Date(borrowRecord.dueDate);
        const newDueDate = new Date(currentDueDate.setDate(currentDueDate.getDate() + 14));

        const updatedRecord = await prisma.borrowRecord.update({
            where: { id: recordId },
            data: {
                dueDate: newDueDate,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId,
                action: "Book Renewal",
                description: `Renewed loan for "${borrowRecord.book.title}" until ${newDueDate.toLocaleDateString()}`,
            },
        });

        return NextResponse.json({
            message: "Book renewed successfully!",
            record: updatedRecord,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to renew book" },
            { status: 500 }
        );
    }
}
