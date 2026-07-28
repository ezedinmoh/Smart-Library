import { requireAuth } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import BorrowHistoryClient from "./BorrowHistoryClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Borrow History - Smart Library" };

interface SP {
  status?: string;
  search?: string;
  page?: string;
}

export default async function BorrowHistoryPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await requireAuth();
  const userId = parseInt(user.id);
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 10;

  const where: any = { userId };
  if (
    params.status &&
    ["borrowed", "returned", "overdue"].includes(params.status)
  )
    where.status = params.status;
  if (params.search)
    where.book = { title: { contains: params.search, mode: "insensitive" } };

  const [records, total] = await Promise.all([
    prisma.borrowRecord.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { book: true },
      orderBy: { borrowDate: "desc" },
    }),
    prisma.borrowRecord.count({ where }),
  ]);

  const { serializePrisma } = require("@/lib/utils");

  return (
    <AppShell>
      <BorrowHistoryClient
        records={serializePrisma(records)}
        total={total}
        page={page}
        pageSize={pageSize}
        searchParams={params}
      />
    </AppShell>
  );
}
