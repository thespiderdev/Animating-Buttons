import GooeyNavbar from "@/components/GooeyNavbar";
import Footer from "@/components/Footer";
import type { ReactNode } from "react";

export default function PageShell({
  children,
  wide = false,
}: {
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <GooeyNavbar />
      <main
        id="main-content"
        className={`mx-auto w-full ${wide ? "max-w-7xl" : "max-w-6xl"} flex-1 px-5 pb-20 pt-32 sm:px-6 md:pt-40`}
      >
        {children}
      </main>
      <Footer />
    </>
  );
}
