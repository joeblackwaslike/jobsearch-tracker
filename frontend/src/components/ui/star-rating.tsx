import { StarIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number | null) => void;
  "aria-label"?: string;
  className?: string;
}

export function StarRating({ value, onChange, "aria-label": ariaLabel, className }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const active = hovered ?? value ?? 0;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
          onClick={() => onChange(value === star ? null : star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <StarIcon
            className={cn(
              "size-5 transition-colors",
              star <= active
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground",
            )}
          />
        </button>
      ))}
    </div>
  );
}
