import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import ManageBooksClient from "./ManageBooksClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Manage Books - Smart Library" };

interface SP {
  search?: string;
  category?: string;
  availability?: string;
  sort?: string;
  page?: string;
}

export default async function ManageBooksPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireLibrarianOrAdmin();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 20;

  const where: any = {};
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { author: { contains: params.search, mode: "insensitive" } },
      { isbn: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.category) where.categoryId = parseInt(params.category);
  if (params.availability === "available") where.availableCopies = { gt: 2 };
  if (params.availability === "low_stock") where.availableCopies = { gt: 0, lte: 2 };
  if (params.availability === "unavailable") where.availableCopies = 0;

  const sortMap: Record<string, any> = {
    "-created_at": { createdAt: "desc" },
    "created_at": { createdAt: "asc" },
    "title": { title: "asc" },
    "-title": { title: "desc" },
    "author": { author: "asc" },
    "available_copies": { availableCopies: "asc" },
    "-available_copies": { availableCopies: "desc" },
  };
  const orderBy = sortMap[params.sort ?? ""] ?? { createdAt: "desc" };

  const [books, total, categories, allStats] = await Promise.all([
    prisma.book.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: true },
      orderBy,
    }),
    prisma.book.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.book.aggregate({
      _sum: { totalCopies: true, availableCopies: true },
      _count: { id: true },
    }),
  ]);

  const [lowStockCount, outOfStockCount, borrowedSum] = await Promise.all([
    prisma.book.count({ where: { availableCopies: { gt: 0, lte: 2 } } }),
    prisma.book.count({ where: { availableCopies: 0 } }),
    prisma.borrowRecord.count({ where: { status: "ACTIVE" } }),
  ]);

  const stats = {
    totalBooks: allStats._count.id,
    totalCopies: allStats._sum.totalCopies ?? 0,
    totalAvailable: allStats._sum.availableCopies ?? 0,
    totalBorrowed: borrowedSum,
    lowStock: lowStockCount,
    outOfStock: outOfStockCount,
  };

  return (
    <AppShell>
      <ManageBooksClient
        books={serializePrisma(books)}
        total={total}
        page={page}
        pageSize={pageSize}
        categories={categories}
        searchParams={params}
        stats={stats}
      />
    </AppShell>
  );
}
