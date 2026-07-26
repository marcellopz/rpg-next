"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail, MessageCircleMore } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

const CONTACT_LINKS = [
  {
    href: "https://discord.com/users/173620782092517376",
    labelKey: "footer.discord",
    icon: MessageCircleMore,
    external: true,
  },
  {
    href: "mailto:marcellopz8@gmail.com",
    labelKey: "footer.email",
    icon: Mail,
    external: false,
  },
] as const;

export function Footer() {
  const { t } = useI18n();

  return (
    <footer id="site-footer" className="mt-auto border-t border-gray-200 bg-white">
      <div className="app-container flex flex-col gap-6 py-8 text-xs text-gray-500 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="" width={24} height={24} />
            <span className="text-sm font-medium text-gray-900">
              {t("navbar.logo")}
            </span>
          </Link>
          <p className="max-w-md leading-relaxed">{t("footer.tagline")}</p>
        </div>

        <div className="space-y-1.5 sm:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
            {t("footer.contact")}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 sm:justify-end">
            {CONTACT_LINKS.map(({ href, labelKey, icon: Icon, external }) => (
              <Link
                key={labelKey}
                href={href}
                className="inline-flex items-center gap-1.5 transition-colors hover:text-gray-900"
                {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{t(labelKey)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
