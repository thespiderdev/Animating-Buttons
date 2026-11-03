"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import {
  SPONSOR_PLANS,
  SPONSOR_CONTACT,
  type SponsorBilling,
  type SponsorTier,
} from "@/lib/sponsors";
export default function Sponsorship({
  checkoutMode,
  error,
}: {
  checkoutMode: "live" | "test";
  error?: string;
}) {
  const [billing, setBilling] = useState<SponsorBilling>("monthly");
  const [selected, setSelected] = useState<SponsorTier>("gold");
  const [brand, setBrand] = useState("");
  const [continuing, setContinuing] = useState(false);
  const details = useRef<HTMLElement>(null);
  const plan = SPONSOR_PLANS.find((plan) => plan.id === selected)!;
  return (
    <>
      <section id="plans" className="mt-16 scroll-mt-32">
        <div className="mb-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">A place for your brand</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Pick your kind of support.
            </h2>
          </div>
          <div
            role="group"
            aria-label="Sponsorship billing"
            className="flex w-fit gap-1 rounded-2xl bg-muted p-1"
          >
            {(["monthly", "lifetime"] as const).map((value) => (
              <button
                key={value}
                aria-pressed={billing === value}
                onClick={() => setBilling(value)}
                className={
                  billing === value ? "action-primary" : "action-secondary"
                }
              >
                {value === "monthly" ? "Monthly" : "Lifetime"}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {SPONSOR_PLANS.map((item) => (
            <article
              key={item.id}
              className={`flex flex-col rounded-3xl border p-6 ${selected === item.id ? "border-brand-blue bg-brand-blue/5" : "border-foreground/10 bg-muted/30"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">{item.name}</h3>
                {item.id === "gold" && (
                  <span className="text-xs text-action-accent">
                    Homepage placement
                  </span>
                )}
              </div>
              <p className="mt-3 min-h-12 text-sm text-muted-foreground">
                {item.description}
              </p>
              <p className="mt-6 text-5xl font-semibold tracking-tight">
                ${item[billing]}
                <span className="ml-2 text-sm font-normal tracking-normal text-muted-foreground">
                  {billing === "monthly" ? "/ month" : "once"}
                </span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {billing === "monthly"
                  ? "Recurring · cancel anytime"
                  : "One payment · project lifetime"}
              </p>
              <ul className="my-8 flex-1 space-y-4 text-sm">
                {item.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-3">
                    <Check
                      className="mt-0.5 shrink-0 text-action-accent"
                      size={16}
                      aria-hidden="true"
                    />
                    {benefit}
                  </li>
                ))}
              </ul>
              <button
                className={
                  selected === item.id
                    ? "action-primary w-full"
                    : "action-secondary w-full"
                }
                onClick={() => {
                  setSelected(item.id);
                  details.current?.scrollIntoView({
                    behavior: window.matchMedia(
                      "(prefers-reduced-motion: reduce)",
                    ).matches
                      ? "instant"
                      : "smooth",
                    block: "start",
                  });
                }}
              >
                Choose {item.name}
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted-foreground">
          Base prices in USD, before applicable tax. Checkout may offer your
          local currency and shows the final total before payment. Monthly plans
          renew automatically. Lifetime plans are a one-time payment for the
          lifetime of this project.
        </p>
      </section>
      <section
        ref={details}
        id="sponsor-details"
        className="mt-16 grid scroll-mt-32 gap-8 rounded-3xl bg-muted/40 p-6 sm:p-8 lg:grid-cols-2"
      >
        <div>
          <p className="eyebrow">Make it yours</p>
          <h2 className="mt-3 text-3xl font-semibold">
            Your next audience starts here.
          </h2>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            {plan.name} placement · ${plan[billing]} USD{" "}
            {billing === "monthly" ? "per month" : "once"}. Share your brand
            details, then complete secure checkout. We review your brand before
            its placement goes live.
          </p>
          <div className="mt-8 flex min-h-40 items-center justify-center gap-4 rounded-2xl border border-dashed border-foreground/20 bg-background p-6">
            <BrandMark size={40} />
            <div>
              <p
                className={
                  selected === "diamond"
                    ? "text-2xl font-semibold"
                    : "text-lg font-semibold"
                }
              >
                {brand || "Your brand here"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.name} sponsor · Placement preview
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            No guaranteed views, clicks or rankings. Sponsorship pays for the
            placements listed above. The button collection stays free.
          </p>
          <a
            href={SPONSOR_CONTACT}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-1 text-sm text-action-accent"
          >
            Need a custom package? Talk to the maintainer{" "}
            <ChevronRight size={16} aria-hidden="true" />
          </a>
        </div>
        <form
          action="/sponsors/checkout"
          method="post"
          className="space-y-4"
          onSubmit={() => setContinuing(true)}
        >
          <input type="hidden" name="plan" value={`${selected}-${billing}`} />
          {checkoutMode === "test" && (
            <p
              className="rounded-xl bg-brand-blue/10 p-4 text-sm text-action-accent"
              role="status"
            >
              Sandbox checkout is enabled. This is a test purchase flow and does
              not collect a real sponsorship payment.
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-foreground/5 p-4 text-sm">
              {error}
            </p>
          )}
          <label className="block text-sm font-medium">
            Brand name
            <input
              name="brand"
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              required
              minLength={2}
              maxLength={80}
              autoComplete="organization"
              placeholder="Your product or company"
              className="field mt-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Website
            <input
              name="website"
              type="url"
              required
              pattern="https://.*"
              maxLength={500}
              placeholder="https://your-product.com"
              className="field mt-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Logo URL{" "}
            <span className="font-normal text-muted-foreground">optional</span>
            <input
              name="logo"
              type="url"
              pattern="https://.*"
              maxLength={500}
              placeholder="https://your-product.com/logo.svg"
              className="field mt-2"
            />
          </label>
          <label className="flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              name="terms"
              value="accepted"
              required
              className="mt-1 size-4 shrink-0 accent-brand-blue"
            />
            <span>
              I have rights to this brand and logo, and agree to the{" "}
              <Link
                href="/terms#sponsorships"
                className="text-action-accent underline"
              >
                sponsorship terms
              </Link>
              .{" "}
              {billing === "monthly"
                ? `I understand this renews at $${plan.monthly} USD each month until canceled.`
                : `I understand the $${plan.lifetime} USD payment covers the lifetime of this project.`}
            </span>
          </label>
          <button className="action-primary w-full" disabled={continuing}>
            {continuing
              ? "Opening checkout…"
              : checkoutMode === "test"
                ? "Continue to test checkout"
                : `Continue to checkout · $${plan[billing]}`}
          </button>
          <p className="text-xs text-muted-foreground">
            Brand details are sent to Dodo Payments with your checkout. Payment
            information is collected on their hosted page. Your placement is
            reviewed after successful payment.
          </p>
        </form>
      </section>
    </>
  );
}
