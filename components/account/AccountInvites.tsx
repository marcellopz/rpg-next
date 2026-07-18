"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  acceptCampaignInvite,
  declineCampaignInvite,
} from "@/app/actions/invites";
import type { AccountInvite } from "@/lib/queries/invites";
import { Button, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

export function AccountInvites({ invites }: { invites: AccountInvite[] }) {
  const { t } = useI18n();
  const router = useRouter();
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function acceptInvite(inviteId: string) {
    setError(null);
    setActiveInviteId(inviteId);
    startTransition(async () => {
      const result = await acceptCampaignInvite(inviteId);
      if (!result.ok) {
        setError(result.error);
        setActiveInviteId(null);
        return;
      }
      if (result.data.publicCode) router.push(`/campaigns/${result.data.publicCode}`);
      router.refresh();
    });
  }

  function declineInvite(inviteId: string) {
    setError(null);
    setActiveInviteId(inviteId);
    startTransition(async () => {
      const result = await declineCampaignInvite(inviteId);
      if (!result.ok) setError(result.error);
      setActiveInviteId(null);
      router.refresh();
    });
  }

  return (
    <section
      id="account-invites"
      className="rounded-2xl border border-gray-200 bg-white p-5"
    >
      <Typography variant="h3" as="h2">
        {t("account.campaignInvites")}
      </Typography>
      <Typography variant="muted" className="mt-1">
        {t("account.campaignInvitesDesc")}
      </Typography>

      {error && <Typography variant="body" className="mt-3 text-red-600">{error}</Typography>}

      {invites.length === 0 ? (
        <Typography variant="muted" className="mt-4">
          {t("invites.noInvites")}
        </Typography>
      ) : (
        <div className="mt-4 space-y-3">
          {invites.map((invite) => {
            const busy = isPending && activeInviteId === invite.id;
            return (
              <div
                key={invite.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Typography variant="body" className="font-semibold text-gray-900">
                      {invite.campaignName}
                    </Typography>
                    <Typography variant="small" as="p" className="mt-1">
                      Invited by {invite.invitedByName}
                      {invite.invitedByEmail ? ` (${invite.invitedByEmail})` : ""}
                    </Typography>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      onClick={() => acceptInvite(invite.id)}
                      disabled={isPending}
                    >
                      {busy ? `${t("buttons.sending")}` : t("invites.accept")}
                    </Button>
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => declineInvite(invite.id)}
                      disabled={isPending}
                    >
                      {t("invites.decline")}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
