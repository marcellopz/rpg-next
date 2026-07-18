"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setMemberRole } from "@/app/actions/campaigns";
import {
  createCampaignInvite,
  revokeCampaignInvite,
} from "@/app/actions/invites";
import type { CampaignMemberRow, CampaignPeopleForAdmin } from "@/lib/queries/invites";
import { Button, Chip, Menu, TextField, Typography } from "@/components/ui";
import { useI18n } from "@/lib/i18n/context";

function statusLabel(status: string, t: (key: string) => string) {
  if (status === "pending") return t("campaignMembers.pending");
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function MemberRoleBadges({ member, t }: { member: CampaignMemberRow; t: (key: string) => string }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
      {member.isOwner && <Chip variant="accent">{t("campaignMembers.admin")}</Chip>}
      {!member.isOwner && member.role === "dm" && (
        <Chip variant="accent">{t("campaignMembers.dm")}</Chip>
      )}
      {!member.isOwner && member.role === "player" && (
        <Chip variant="neutral">{t("campaignMembers.player")}</Chip>
      )}
      {member.isOwner && member.role === "dm" && (
        <Chip variant="accent">{t("campaignMembers.dm")}</Chip>
      )}
    </div>
  );
}

function MemberRoleMenu({
  campaignId,
  member,
  t,
}: {
  campaignId: string;
  member: CampaignMemberRow;
  t: (key: string) => string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeRole(role: "dm" | "player") {
    if (member.role === role) return;
    startTransition(async () => {
      const result = await setMemberRole({
        campaignId,
        userId: member.userId,
        role,
      });
      if (result?.ok) router.refresh();
    });
  }

  const entries = [];
  if (member.role !== "dm") {
    entries.push({
      label: t("campaignMembers.setDm"),
      onSelect: () => changeRole("dm"),
    });
  }
  if (member.role !== "player") {
    entries.push({
      label: t("campaignMembers.setPlayer"),
      onSelect: () => changeRole("player"),
    });
  }

  if (entries.length === 0) return null;

  return (
    <Menu
      label={`Change role for ${member.displayName}`}
      entries={entries}
    />
  );
}

export function CampaignMembersSettings({
  campaignId,
  people,
}: {
  campaignId: string;
  people: CampaignPeopleForAdmin;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await createCampaignInvite({ campaignId, email });
      if (!result?.ok) {
        setError(result?.error ?? t("errors.create"));
        return;
      }
      setEmail("");
      setSaved(true);
      router.refresh();
    });
  }

  function revokeInvite(inviteId: string) {
    setError(null);
    setSaved(false);
    setActiveInviteId(inviteId);
    startTransition(async () => {
      const result = await revokeCampaignInvite(inviteId);
      if (!result?.ok) setError(result?.error ?? t("errors.delete"));
      setActiveInviteId(null);
      router.refresh();
    });
  }

  return (
    <section
      id="campaign-settings-members"
      className="rounded-2xl border border-gray-200 bg-white p-6"
    >
      <Typography variant="h3" as="h2">
        {t("campaignMembers.title")}
      </Typography>
      <Typography variant="muted" className="mt-1">
        {t("campaignMembers.role")}
      </Typography>

      <form onSubmit={sendInvite} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <TextField
          id="settings-invite-email"
          type="email"
          placeholder={t("campaignMembers.invitePlaceholder")}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setSaved(false);
          }}
          error={error}
          className="sm:min-w-72"
        />
        <Button type="submit" disabled={isPending || !email.trim()}>
          {isPending && !activeInviteId ? t("campaignSettings.saving") : t("campaignMembers.inviteBtn")}
        </Button>
      </form>
      {saved && (
        <Typography variant="small" as="p" className="mt-2 text-gray-500">
          {t("invites.section")}
        </Typography>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <Typography variant="body" className="font-semibold text-gray-900">
            {t("campaignMembers.title")}
          </Typography>
          <div className="mt-3 space-y-2">
            {people.members.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Typography variant="body" className="truncate font-medium">
                      {member.displayName}
                    </Typography>
                    {member.email && (
                      <Typography variant="small" as="p" className="truncate">
                        {member.email}
                      </Typography>
                    )}
                    {member.isOwner && (
                      <Typography variant="small" as="p" className="mt-1 text-gray-500">
                        {t("campaignMembers.admin")}
                      </Typography>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <MemberRoleBadges member={member} t={t} />
                    <MemberRoleMenu campaignId={campaignId} member={member} t={t} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Typography variant="body" className="font-semibold text-gray-900">
            {t("campaignMembers.invites")}
          </Typography>
          {people.invites.length === 0 ? (
            <Typography variant="muted" className="mt-3">
              {t("campaignMembers.noPending")}
            </Typography>
          ) : (
            <div className="mt-3 space-y-2">
              {people.invites.map((invite) => {
                const pending = invite.status === "pending";
                const busy = isPending && activeInviteId === invite.id;
                return (
                  <div
                    key={invite.id}
                    className="rounded-xl border border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Typography variant="body" className="truncate font-medium">
                          {invite.email}
                        </Typography>
                        <Typography variant="small" as="p" className="truncate">
                          Invited by {invite.invitedByName}
                        </Typography>
                      </div>
                      <Chip
                        variant={invite.status === "pending" ? "accent" : "neutral"}
                      >
                        {statusLabel(invite.status, t)}
                      </Chip>
                    </div>
                    {pending && (
                      <Button
                        size="xs"
                        variant="dangerOutline"
                        className="mt-3"
                        onClick={() => revokeInvite(invite.id)}
                        disabled={isPending}
                      >
                        {busy ? t("campaignSettings.saving") : t("campaignMembers.invites")}
                      </Button>
                    )}
                    {invite.acceptedByName && (
                      <Typography variant="small" as="p" className="mt-2">
                        Accepted by {invite.acceptedByName}
                      </Typography>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
