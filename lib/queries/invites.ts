import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { isCampaignAdmin } from "@/lib/queries/campaigns";

export type AccountInvite = {
  id: string;
  campaignId: string;
  campaignCode: string;
  campaignName: string;
  invitedByName: string;
  invitedByEmail: string | null;
  createdAt: string;
};

export type CampaignMemberRow = {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  role: "dm" | "player";
  joinedAt: string;
};

export type CampaignInviteStatus = "pending" | "accepted" | "revoked";

export type CampaignInviteRow = {
  id: string;
  email: string;
  role: "player";
  status: CampaignInviteStatus;
  invitedByName: string;
  invitedByEmail: string | null;
  acceptedByName: string | null;
  acceptedByEmail: string | null;
  createdAt: string;
  acceptedAt: string | null;
  revokedAt: string | null;
};

export type CampaignPeopleForAdmin = {
  members: CampaignMemberRow[];
  invites: CampaignInviteRow[];
};

type AuthLabel = {
  displayName: string;
  email: string | null;
};

function userLabelFromAuthUser(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AuthLabel {
  return {
    displayName:
      (user.user_metadata?.display_name as string | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      user.id,
    email: user.email ?? null,
  };
}

async function getAuthLabels(userIds: string[]): Promise<Record<string, AuthLabel>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  const admin = createAdminClient();
  const labels: Record<string, AuthLabel> = {};

  await Promise.all(
    uniqueIds.map(async (userId) => {
      const { data } = await admin.auth.admin.getUserById(userId);
      if (data.user) labels[userId] = userLabelFromAuthUser(data.user);
    })
  );

  return labels;
}

export async function getPendingInviteCountForCurrentUser(): Promise<number> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return 0;

  const admin = createAdminClient();
  const { count } = await admin
    .from("campaign_invites")
    .select("id", { count: "exact", head: true })
    .ilike("invitee_email", user.email)
    .is("accepted_at", null)
    .is("revoked_at", null);

  return count ?? 0;
}

type AccountInviteRow = {
  id: string;
  campaign_id: string;
  invited_by: string;
  created_at: string;
  campaigns: {
    public_code: string;
    name: string;
  } | null;
};

export async function getPendingInvitesForCurrentUser(): Promise<AccountInvite[]> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("campaign_invites")
    .select("id, campaign_id, invited_by, created_at, campaigns(public_code, name)")
    .ilike("invitee_email", user.email)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .returns<AccountInviteRow[]>();

  const rows = (data ?? []).filter((row) => row.campaigns);
  const labels = await getAuthLabels(rows.map((row) => row.invited_by));

  return rows.map((row) => {
    const inviter = labels[row.invited_by];
    return {
      id: row.id,
      campaignId: row.campaign_id,
      campaignCode: row.campaigns?.public_code ?? "",
      campaignName: row.campaigns?.name ?? "Campaign",
      invitedByName: inviter?.displayName ?? "A campaign admin",
      invitedByEmail: inviter?.email ?? null,
      createdAt: row.created_at,
    };
  });
}

type MembershipRow = {
  id: string;
  user_id: string;
  role: "dm" | "player";
  created_at: string;
};

type InviteAdminRow = {
  id: string;
  invitee_email: string;
  role: "player";
  invited_by: string;
  accepted_by: string | null;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

function inviteStatus(row: InviteAdminRow): CampaignInviteStatus {
  if (row.accepted_at) return "accepted";
  if (row.revoked_at) return "revoked";
  return "pending";
}

export async function getCampaignPeopleForAdmin(
  campaignId: string
): Promise<CampaignPeopleForAdmin | null> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  if (!(await isCampaignAdmin(user.id, campaignId))) return null;

  const admin = createAdminClient();
  const [{ data: memberRows }, { data: inviteRows }] = await Promise.all([
    admin
      .from("memberships")
      .select("id, user_id, role, created_at")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true })
      .returns<MembershipRow[]>(),
    admin
      .from("campaign_invites")
      .select(
        "id, invitee_email, role, invited_by, accepted_by, accepted_at, revoked_at, created_at"
      )
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false })
      .returns<InviteAdminRow[]>(),
  ]);

  const members = memberRows ?? [];
  const invites = inviteRows ?? [];
  const labels = await getAuthLabels([
    ...members.map((row) => row.user_id),
    ...invites.map((row) => row.invited_by),
    ...invites.map((row) => row.accepted_by ?? ""),
  ]);

  return {
    members: members.map((row) => {
      const label = labels[row.user_id];
      return {
        id: row.id,
        userId: row.user_id,
        displayName: label?.displayName ?? row.user_id,
        email: label?.email ?? null,
        role: row.role,
        joinedAt: row.created_at,
      };
    }),
    invites: invites.map((row) => {
      const inviter = labels[row.invited_by];
      const accepter = row.accepted_by ? labels[row.accepted_by] : undefined;
      return {
        id: row.id,
        email: row.invitee_email,
        role: "player",
        status: inviteStatus(row),
        invitedByName: inviter?.displayName ?? "Unknown",
        invitedByEmail: inviter?.email ?? null,
        acceptedByName: accepter?.displayName ?? null,
        acceptedByEmail: accepter?.email ?? null,
        createdAt: row.created_at,
        acceptedAt: row.accepted_at,
        revokedAt: row.revoked_at,
      };
    }),
  };
}
