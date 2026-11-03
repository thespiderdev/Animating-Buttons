import Image from "next/image";
import { cn } from "@/lib/utils";

export default function BrandMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      unoptimized
      src="/brand/logo.svg?v=4"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
