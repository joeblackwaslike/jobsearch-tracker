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

const DURATION_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
  { value: 75, label: "1 hr 15 min" },
  { value: 90, label: "1 hr 30 min" },
  { value: 105, label: "1 hr 45 min" },
  { value: 120, label: "2 hr" },
  { value: 135, label: "2 hr 15 min" },
  { value: 150, label: "2 hr 30 min" },
  { value: 165, label: "2 hr 45 min" },
  { value: 180, label: "3 hr" },
] as const;

function formatDuration(minutes: number): string {
  const preset = DURATION_OPTIONS.find((o) => o.value === minutes);
  if (preset) return preset.label;
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

interface DurationComboboxProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}

export function DurationCombobox({ value, onChange }: DurationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const parsed = parseInt(input, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    e.preventDefault();
    onChange(parsed);
    setInput("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Duration"
          className="w-full justify-between font-normal"
          onPointerDown={(e) => e.preventDefault()}
        >
          {value != null ? formatDuration(value) : "Select duration..."}
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Minutes (e.g. 45) or pick below..."
            value={input}
            onKeyDown={handleKeyDown}
            onValueChange={(val) => {
              setInput(val);
              const parsed = parseInt(val, 10);
              if (!Number.isNaN(parsed) && parsed > 0) {
                onChange(parsed);
              } else if (val === "") {
                onChange(undefined);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>Type a number of minutes.</CommandEmpty>
            <CommandGroup>
              {(() => {
                const parsed = parseInt(input, 10);
                const isValidCustom =
                  !Number.isNaN(parsed) &&
                  parsed > 0 &&
                  !DURATION_OPTIONS.some((o) => o.value === parsed);
                if (!isValidCustom) return null;
                return (
                  <CommandItem
                    key="__custom__"
                    value="__custom__"
                    onSelect={() => {
                      onChange(parsed);
                      setInput("");
                      setOpen(false);
                    }}
                  >
                    <CheckIcon className="mr-2 size-4 opacity-0" />
                    Use {parsed} min
                  </CommandItem>
                );
              })()}
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(undefined);
                  setInput("");
                  setOpen(false);
                }}
              >
                <CheckIcon
                  className={cn("mr-2 size-4", value == null ? "opacity-100" : "opacity-0")}
                />
                None
              </CommandItem>
              {DURATION_OPTIONS.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value.toString()}
                  onSelect={() => {
                    onChange(opt.value);
                    setInput("");
                    setOpen(false);
                  }}
                >
                  <CheckIcon
                    className={cn("mr-2 size-4", value === opt.value ? "opacity-100" : "opacity-0")}
                  />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
