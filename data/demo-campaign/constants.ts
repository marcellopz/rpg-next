// Reserved campaign code for the static, read-only demo campaign. Kept in its
// own module (no data imports) so every other demo-campaign file can safely
// import it without circular dependencies.
export const DEMO_CAMPAIGN_CODE = "demo";

export function isDemoCampaignId(id: string | null | undefined): boolean {
  return id === DEMO_CAMPAIGN_CODE;
}
