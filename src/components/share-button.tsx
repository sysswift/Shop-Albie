import { useState } from "react";

interface ShareButtonProps {
  title: string;
  text?: string;
  slug: string;
  /** compact = small icon only (for product cards), full = icon + label (for product page) */
  variant?: "compact" | "full";
}

export function ShareButton({ title, text, slug, variant = "compact" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  function getUrl() {
    // Use current origin so it works on localhost AND on a real domain
    return `${window.location.origin}/product/${slug}`;
  }

  async function handleShare() {
    const url = getUrl();
    const shareData = {
      title,
      text: text ?? `Check out "${title}" on Shop Albie 🛍️`,
      url,
    };

    // Native share sheet (all modern phones)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // User cancelled — do nothing
        return;
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Last resort — prompt
      window.prompt("Copy this link:", url);
    }
  }

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-3 border border-border text-xs uppercase tracking-widest font-medium hover:bg-surface transition-colors"
        title="Share this product"
      >
        <ShareIcon />
        {copied ? "Link copied!" : "Share"}
      </button>
    );
  }

  // Compact — icon only, shown on product cards
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault(); // stop the card Link from navigating
        e.stopPropagation();
        handleShare();
      }}
      className={`absolute top-2 right-2 z-10 size-8 flex items-center justify-center rounded-full transition-all ${
        copied
          ? "bg-green-500 text-white"
          : "bg-background/80 hover:bg-background text-foreground/70 hover:text-foreground"
      }`}
      title={copied ? "Link copied!" : "Share this product"}
      aria-label="Share"
    >
      {copied ? <CheckIcon /> : <ShareIcon />}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
