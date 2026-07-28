import type { Metadata } from "next";
import PasswordResetForm from "./PasswordResetForm";
export const metadata: Metadata = { title: "Reset Password - Smart Library" };
export default function PasswordResetPage() { return <PasswordResetForm />; }
