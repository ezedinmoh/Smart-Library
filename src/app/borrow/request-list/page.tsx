import { requireStudent } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import RequestListClient from "./RequestListClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Browse & Request Books - Smart Library",
};

interface SP {
  search?: string;
  category?: string;
  availability?: string;
  page?: string;
}

export default async function RequestListPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await requireStudent();
  const userId = parseInt(user.id);
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 30;

  const where: any = {};
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { author: { contains: params.search, mode: "insensitive" } },
      { isbn: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.category) where.categoryId = parseInt(params.category);
  if (params.availability === "available") where.availableCopies = { gt: 0 };

  const [books, total, categories, profile, userRequests, userBorrows] =
    await Promise.all([
      prisma.book.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { category: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.book.count({ where }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      prisma.userProfile.findUnique({ where: { userId } }),
      prisma.bookRequest.findMany({
        where: { userId, status: { in: ["pending", "ready"] } },
        select: { bookId: true },
      }),
      prisma.borrowRecord.findMany({
        where: { userId, status: { in: ["borrowed", "overdue"] } },
        select: { bookId: true },
      }),
    ]);

  const currentBorrowed = await prisma.borrowRecord.count({
    where: { userId, status: { in: ["borrowed", "overdue"] } },
  });
  const pendingCount = await prisma.bookRequest.count({
    where: { userId, status: { in: ["pending", "ready"] } },
  });
  const maxLimit = profile?.maxBooksAllowed ?? 7;

  return (
    <AppShell>
      <RequestListClient
        books={serializePrisma(books)}
        total={total}
        page={page}
        pageSize={pageSize}
        categories={categories}
        searchParams={searchParams}
        alreadyRequested={new Set(userRequests.map((r) => r.bookId))}
        alreadyBorrowed={new Set(userBorrows.map((b) => b.bookId))}
        currentBorrowed={currentBorrowed}
        pendingCount={pendingCount}
        maxLimit={maxLimit}
        canRequestMore={currentBorrowed + pendingCount < maxLimit}
      />
    </AppShell>
  );
}
