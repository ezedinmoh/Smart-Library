import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import BooksListClient from "./BooksListClient";
import { serializePrisma } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Book Catalog - Smart Library" };

interface SearchParams {
  search?: string;
  category?: string;
  language?: string;
  availability?: string;
  page?: string;
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 30;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { author: { contains: params.search, mode: "insensitive" } },
      { isbn: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.category) where.categoryId = parseInt(params.category);
  if (params.language) where.language = params.language;
  if (params.availability === "available") where.availableCopies = { gt: 0 };
  if (params.availability === "unavailable") where.availableCopies = 0;

  const [books, totalFiltered, totalAllBooks, availableAllBooks, categories] = await Promise.all([
    prisma.book.findMany({
      where,
      skip,
      take: pageSize,
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.book.count({ where }),
    prisma.book.count(),
    prisma.book.count({ where: { availableCopies: { gt: 0 } } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <AppShell>
      <BooksListClient
        books={serializePrisma(books)}
        total={totalFiltered}
        totalAllBooks={totalAllBooks}
        availableAllBooks={availableAllBooks}
        page={page}
        pageSize={pageSize}
        categories={serializePrisma(categories)}
        searchParams={params}
      />
    </AppShell>
  );
}
