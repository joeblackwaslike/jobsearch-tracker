import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import cities from "@/data/major-us-cities.json";
import { cn } from "@/lib/utils";

interface CityMultiComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function CityMultiCombobox({ value, onChange }: CityMultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = (cities as string[])
    .filter((c) => c.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 50);

  function handleSelect(city: string) {
    if (value.includes(city)) {
      onChange(value.filter((v) => v !== city));
    } else {
      onChange([...value, city]);
    }
    setSearch("");
  }

  function handleRemove(city: string) {
    onChange(value.filter((v) => v !== city));
  }

  function handleCustom() {
    if (search && !value.includes(search)) {
      onChange([...value, search]);
    }
    setSearch("");
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setSearch("");
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate text-muted-foreground">
              {value.length === 0
                ? "Add location..."
                : `${value.length} location${value.length > 1 ? "s" : ""}`}
            </span>
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Search city..." value={search} onValueChange={setSearch} />
            <CommandList className="max-h-[300px] overflow-y-auto">
              <CommandEmpty>
                {search ? (
                  <button
                    type="button"
                    className="px-3 py-2 text-sm w-full text-left hover:bg-accent"
                    onClick={handleCustom}
                  >
                    Add &ldquo;{search}&rdquo;
                  </button>
                ) : (
                  <span className="px-3 py-2 text-sm text-muted-foreground">
                    Type to search cities
                  </span>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filtered.map((city) => (
                  <CommandItem key={city} value={city} onSelect={() => handleSelect(city)}>
                    <CheckIcon
                      className={cn(
                        "mr-2 size-4",
                        value.includes(city) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((city) => (
            <Badge key={city} variant="secondary" className="gap-1 pr-1">
              {city}
              <button
                type="button"
                aria-label={`Remove ${city}`}
                onClick={() => handleRemove(city)}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
