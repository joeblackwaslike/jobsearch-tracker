import * as SliderPrimitive from "@radix-ui/react-slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const PERIOD_OPTIONS = [
  { value: "yearly", label: "Annual" },
  { value: "hourly", label: "Hourly" },
] as const;

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;

interface SalaryRangeSliderProps {
  period: string;
  currency: string;
  min: number;
  max: number;
  onChange: (values: { period: string; currency: string; min: number; max: number }) => void;
}

function formatSalary(value: number, period: string): string {
  if (period === "yearly") {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${value}`;
}

export function SalaryRangeSlider({ period, currency, min, max, onChange }: SalaryRangeSliderProps) {
  const isYearly = period === "yearly";
  const sliderMax = isYearly ? 1_000_000 : 500;
  const step = isYearly ? 1000 : 1;

  const safeMin = Math.min(min, sliderMax);
  const safeMax = Math.min(max, sliderMax);

  function handlePeriodChange(newPeriod: string) {
    onChange({ period: newPeriod, currency, min: 0, max: 0 });
  }

  function handleCurrencyChange(newCurrency: string) {
    onChange({ period, currency: newCurrency, min, max });
  }

  function handleSliderChange([newMin, newMax]: number[]) {
    onChange({ period, currency, min: newMin, max: newMax });
  }

  const rangeLabel =
    safeMin === 0 && safeMax === 0
      ? "Not specified"
      : `${formatSalary(safeMin, period)} – ${formatSalary(safeMax, period)}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Period</Label>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Range</span>
          <span className="font-medium text-foreground">{rangeLabel}</span>
        </div>
        <SliderPrimitive.Root
          className="relative flex w-full touch-none select-none items-center"
          min={0}
          max={sliderMax}
          step={step}
          value={[safeMin, safeMax]}
          onValueChange={handleSliderChange}
        >
          <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
            <SliderPrimitive.Range className="absolute h-full bg-primary" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb className="block size-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
          <SliderPrimitive.Thumb className="block size-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
        </SliderPrimitive.Root>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$0</span>
          <span>{isYearly ? "$1M" : "$500"}</span>
        </div>
      </div>
    </div>
  );
}
