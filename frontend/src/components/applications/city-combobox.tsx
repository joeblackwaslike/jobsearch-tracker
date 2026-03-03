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
import cities from "@/data/major-us-cities.json";
import { cn } from "@/lib/utils";

interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function CityCombobox({ value, onChange }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || "City, State..."}</span>
          <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search city..." value={search} onValueChange={setSearch} />
          <CommandList className="max-h-[300px] overflow-y-auto">
            <CommandEmpty>No city found. Type to use custom value.</CommandEmpty>
            <CommandGroup>
              {(cities as string[])
                .filter((c) => c.toLowerCase().includes(search.toLowerCase()))
                .slice(0, 50)
                .map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={(val) => {
                      onChange(val);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <CheckIcon
                      className={cn("mr-2 size-4", value === city ? "opacity-100" : "opacity-0")}
                    />
                    {city}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
