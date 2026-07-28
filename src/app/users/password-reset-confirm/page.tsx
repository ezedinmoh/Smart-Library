import type { Metadata } from "next";
import PasswordResetConfirmForm from "./PasswordResetConfirmForm";
export const metadata: Metadata = { title: "Set New Password - Smart Library" };
export default async function PasswordResetConfirmPage({ searchParams }: { searchParams: Promise<{ token?: string; email?: string }> }) {
    const params = await searchParams;
    return <PasswordResetConfirmForm token={params.token ?? ""} email={params.email ?? ""} />;
}
