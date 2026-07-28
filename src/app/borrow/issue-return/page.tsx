import { requireLibrarianOrAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import IssueReturnClient from "./IssueReturnClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Issue & Return - Smart Library" };

interface SP {
  search?: string;
  status?: string;
  page?: string;
}

export default async function IssueReturnPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireLibrarianOrAdmin();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = { status: { in: ["borrowed", "overdue"] } };
  if (params.search) {
    where.AND = [
      { status: { in: ["borrowed", "overdue"] } },
      {
        OR: [
          {
            user: {
              username: { contains: params.search, mode: "insensitive" },
            },
          },
          {
            user: {
              firstName: { contains: params.search, mode: "insensitive" },
            },
          },
          { book: { title: { contains: params.search, mode: "insensitive" } } },
        ],
      },
    ];
    delete where.status;
  }
  if (params.status && ["borrowed", "overdue"].includes(params.status)) {
    where.status = params.status;
  }

  const [records, total] = await Promise.all([
    prisma.borrowRecord.findMany({
      where,
      skip,
      take: pageSize,
      include: { user: true, book: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.borrowRecord.count({ where }),
  ]);

  const { serializePrisma } = require("@/lib/utils");

  return (
    <AppShell>
      <IssueReturnClient
        records={serializePrisma(records)}
        total={total}
        page={page}
        pageSize={pageSize}
        searchParams={searchParams}
      />
    </AppShell>
  );
}
