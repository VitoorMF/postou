"use client";

import { useRouter } from "next/navigation";

// Botão da landing → leva pra página /entrar (Google + magic link).
export default function SignInButton({
  children,
  className,
  mode,
}: {
  children: React.ReactNode;
  className?: string;
  mode?: "signup";
}) {
  const router = useRouter();
  return (
    <button
      className={className}
      onClick={() => router.push(`/entrar${mode === "signup" ? "?mode=signup" : ""}`)}
    >
      {children}
    </button>
  );
}
