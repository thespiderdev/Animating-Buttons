import Link from "next/link";
import type { ButtonItem } from "@/lib/community";
export default function ButtonCredit({
  button,
  className,
}: {
  button: ButtonItem;
  className?: string;
}) {
  if (
    button.source &&
    /(^|\.)uiverse\.io$/i.test(new URL(button.source.authorUrl).hostname)
  ) {
    return <span className={className}>{button.source.authorName}</span>;
  }
  return button.source ? (
    <a
      href={button.source.authorUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {button.source.authorName}
    </a>
  ) : (
    <Link
      href={`/user/${encodeURIComponent(button.githubUsername)}`}
      className={className}
    >
      @{button.githubUsername}
    </Link>
  );
}
