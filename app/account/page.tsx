import { createServerClient } from "@/lib/supabase/server";
import { PictoAvatar } from "@/components/PictoAvatar";
import { DisplayNameForm } from "@/components/DisplayNameForm";
import { Typography } from "@/components/ui";

export default async function AccountPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware protects this route, so `user` is expected to be present.
  const currentDisplayName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    "";
  const avatarSeed = user?.email ?? user?.id ?? "";

  return (
    <div id="account-page" className="mx-auto max-w-lg space-y-6 px-6 py-8">
      <Typography variant="h1">Account</Typography>

      <div id="account-profile" className="flex items-center gap-3">
        <PictoAvatar seed={avatarSeed} size={56} />
        <div>
          <Typography variant="body">{user?.email}</Typography>
          <Typography variant="muted">Signed in</Typography>
        </div>
      </div>

      <DisplayNameForm initialDisplayName={currentDisplayName} />
    </div>
  );
}
