export type SponsorTier = "silver" | "gold" | "diamond";
export type SponsorBilling = "monthly" | "lifetime";
export const SPONSOR_PLANS = [
  {
    id: "silver",
    name: "Silver",
    monthly: 19,
    lifetime: 199,
    description: "A lasting place in the community.",
    benefits: [
      "Linked brand on the sponsors page",
      "Named credit in the project README",
      "Your own sponsor destination link",
    ],
  },
  {
    id: "gold",
    name: "Gold",
    monthly: 49,
    lifetime: 499,
    description: "Meet developers on the homepage.",
    benefits: [
      "Larger logo on the sponsors page",
      "Logo in the homepage sponsor section",
      "Linked logo in the project README",
    ],
  },
  {
    id: "diamond",
    name: "Diamond",
    monthly: 99,
    lifetime: 999,
    description: "Make your brand part of the experience.",
    benefits: [
      "Largest logo on the sponsors page",
      "Prominent homepage sponsor placement",
      "Prominent linked logo in the README",
    ],
  },
] as const;
export type ActiveSponsor = {
  name: string;
  url: string;
  logo?: string;
  tier: SponsorTier;
  billing: SponsorBilling;
  paidThrough?: string;
};
// Add only paid, approved brands. Recurring placements expire with their paid period.
export const ACTIVE_SPONSORS: ActiveSponsor[] = [];
export function activeSponsors(now = new Date()) {
  return ACTIVE_SPONSORS.filter(
    (sponsor) =>
      sponsor.billing === "lifetime" ||
      (sponsor.paidThrough && Date.parse(sponsor.paidThrough) > now.getTime()),
  );
}
export const SPONSOR_CONTACT = "https://x.com/oom_gawande";
export function sponsorshipSelection(value: string) {
  const match = /^(silver|gold|diamond)-(monthly|lifetime)$/.exec(value);
  return match
    ? {
        tier: match[1] as SponsorTier,
        billing: match[2] as SponsorBilling,
        plan: SPONSOR_PLANS.find((plan) => plan.id === match[1])!,
      }
    : null;
}
