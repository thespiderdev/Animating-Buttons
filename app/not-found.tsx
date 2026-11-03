import type { Metadata } from "next";
import Footer from "@/components/Footer";
import GooeyNavbar from "@/components/GooeyNavbar";
import NotFoundHero from "@/components/not-found/NotFoundHero";
import { fetchStarCount } from "@/lib/github";

export const metadata: Metadata = {
  title: "Page not found",
  description: "This page does not exist. Browse the buttons instead.",
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default async function NotFound() {
  const stars = await fetchStarCount();

  return (
    <>
      <GooeyNavbar stars={stars} />

      <NotFoundHero />

      <Footer />
    </>
  );
}
