"use client";

import { useState } from "react";
import { buttonVariants } from "@/components/ui";
import { CampaignSearchModal } from "./CampaignSearchModal";

export function CampaignSearchButton({
  campaignId,
  publicCode,
}: {
  campaignId: string;
  publicCode: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={buttonVariants({ variant: "white", size: "sm" })}
      >
        Search
      </button>

      {open && (
        <CampaignSearchModal
          campaignId={campaignId}
          publicCode={publicCode}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
