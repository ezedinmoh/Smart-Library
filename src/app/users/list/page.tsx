import { requireAdmin } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import UsersListClient from "./UsersListClient";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Manage Users - Smart Library" };

interface SP {
  search?: string;
  role?: string;
  status?: string;
  page?: string;
}

export default async function UsersListPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1"));
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (params.search) {
    where.OR = [
      { username: { contains: params.search, mode: "insensitive" } },
      { firstName: { contains: params.search, mode: "insensitive" } },
      { lastName: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ];
  }
  if (params.role && ["admin", "librarian", "student"].includes(params.role))
    where.role = params.role;
  if (params.status === "active") where.isActive = true;
  if (params.status === "inactive") where.isActive = false;

  const [users, total, roleCounts] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
    prisma.user.groupBy({ by: ["role"], _count: { id: true } }),
  ]);

  const counts = {
    admin: 0,
    librarian: 0,
    student: 0,
    total: await prisma.user.count(),
  };
  roleCounts.forEach((r) => {
    (counts as any)[r.role] = r._count.id;
  });

  const safeUsers = users.map(u => ({
    ...u,
    profile: u.profile ? {
      ...u.profile,
      totalFines: u.profile.totalFines ? parseFloat(u.profile.totalFines.toString()) : 0
    } : null
  }));

  return (
    <AppShell>
      <UsersListClient
        users={safeUsers}
        total={total}
        page={page}
        pageSize={pageSize}
        searchParams={params}
        roleCounts={counts}
      />
    </AppShell>
  );
}
