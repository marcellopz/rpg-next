"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui";
import { loginUrl } from "@/lib/auth/login-url";
import { useI18n } from "@/lib/i18n/context";

export function SignInLink() {
  const { t } = useI18n();

  return (
    <Link href={loginUrl("/campaigns")} className={buttonVariants()}>
      {t("navbar.signIn")}
    </Link>
  );
}
