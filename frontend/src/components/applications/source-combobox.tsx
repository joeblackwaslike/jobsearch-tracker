import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const SOURCE_OPTIONS = [
  "google search",
  "google jobs",
  "theirstack",
  "welcome to the jungle",
  "linkedin",
  "wellfound",
  "glassdoor",
  "builtin",
  "workatastartup",
  "indeed",
  "dice",
  "ziprecruiter",
  "levels",
  "blind",
  "referral",
];

interface SourceComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SourceCombobox({ value, onChange }: SourceComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "Select or type source..."}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search or type source..."
            value={value}
            onValueChange={onChange}
          />
          <CommandList>
            <CommandEmpty>
              <button
                type="button"
                className="px-3 py-2 text-sm w-full text-left hover:bg-accent"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Use &ldquo;{value}&rdquo;
              </button>
            </CommandEmpty>
            <CommandGroup>
              {SOURCE_OPTIONS.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={(val) => {
                    onChange(val);
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === option ? "opacity-100" : "opacity-0")}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
