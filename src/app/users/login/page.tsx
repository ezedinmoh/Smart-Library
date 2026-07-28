import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Login - Smart Library" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
    const params = await searchParams;
    return <LoginForm nextUrl={params.next} errorParam={params.error} />;
}
