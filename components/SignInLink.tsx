"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { loginUrl } from "@/lib/auth/login-url";

export function SignInLink({
  className,
  children = "Sign in",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();
  const returnPath = qs ? `${pathname}?${qs}` : pathname;

  return (
    <Link href={loginUrl(returnPath)} className={className}>
      {children}
    </Link>
  );
}
