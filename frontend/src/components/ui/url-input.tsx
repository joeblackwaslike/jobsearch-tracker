import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  validate?: boolean;
  allowBlank?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  error?: string;
}

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function UrlInput({
  value,
  onChange,
  validate = true,
  allowBlank = true,
  id,
  placeholder = "https://...",
  className,
  error: externalError,
}: UrlInputProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  const handleBlur = () => {
    if (!validate) {
      setLocalError(null);
      return;
    }
    const trimmed = value.trim();
    if (trimmed === "") {
      setLocalError(allowBlank ? null : "URL is required");
    } else if (!isValidUrl(trimmed)) {
      setLocalError("Must be a valid URL (e.g. https://example.com)");
    } else {
      setLocalError(null);
    }
  };

  const displayError = externalError ?? localError;

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(displayError && "border-destructive", className)}
        aria-invalid={!!displayError}
        aria-describedby={displayError ? `${id}-error` : undefined}
      />
      {displayError && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {displayError}
        </p>
      )}
    </div>
  );
}
