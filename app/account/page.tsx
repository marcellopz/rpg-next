import { createServerClient } from "@/lib/supabase/server";
import { PictoAvatar } from "@/components/PictoAvatar";
import { DisplayNameForm } from "@/components/DisplayNameForm";

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
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-bold">Account</h1>

      <div className="flex items-center gap-3">
        <PictoAvatar seed={avatarSeed} size={56} />
        <div className="text-sm">
          <p className="text-gray-300">{user?.email}</p>
          <p className="text-gray-500">Signed in</p>
        </div>
      </div>

      <DisplayNameForm initialDisplayName={currentDisplayName} />
    </div>
  );
}
