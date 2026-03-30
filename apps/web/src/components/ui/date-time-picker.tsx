import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  minDate?: Date;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function DateTimePicker({
  value,
  onChange,
  minDate,
  disabled,
  placeholder = "Pick a date & time",
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  const hours = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => i),
    []
  );
  const minutes = React.useMemo(
    () => Array.from({ length: 60 }, (_, i) => i),
    []
  );

  const handleDateSelect = (day: Date | undefined) => {
    if (!day) return;

    if (value) {
      // Preserve the existing time when selecting a new date
      day.setHours(value.getHours(), value.getMinutes());
    } else {
      // Default to current time + 1 hour when no prior value
      const now = new Date();
      day.setHours(now.getHours() + 1, 0);
    }

    onChange(new Date(day));
  };

  const handleHourChange = (hour: string) => {
    if (!value) return;
    const updated = new Date(value);
    updated.setHours(parseInt(hour, 10));
    onChange(updated);
  };

  const handleMinuteChange = (minute: string) => {
    if (!value) return;
    const updated = new Date(value);
    updated.setMinutes(parseInt(minute, 10));
    onChange(updated);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            "bg-zinc-950 border-zinc-700 text-zinc-100 hover:bg-zinc-900 hover:text-zinc-100",
            "focus-visible:ring-indigo-500 focus-visible:border-indigo-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            !value && "text-zinc-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate flex-1">
            {value ? format(value, "MMM d, yyyy  HH:mm") : placeholder}
          </span>
          {value && !disabled && (
            <X
              className="ml-2 h-3.5 w-3.5 shrink-0 text-zinc-500 hover:text-zinc-300 transition-colors"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          disabled={(date) => (minDate ? date < minDate : false)}
          initialFocus
        />
        <div className="border-t border-border px-3 py-3 flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Time:
          </span>
          <Select
            value={value ? String(value.getHours()) : undefined}
            onValueChange={handleHourChange}
            disabled={!value}
          >
            <SelectTrigger className="w-[70px] h-8 text-sm">
              <SelectValue placeholder="HH" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {hours.map((h) => (
                <SelectItem key={h} value={String(h)}>
                  {String(h).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground font-bold">:</span>
          <Select
            value={value ? String(value.getMinutes()) : undefined}
            onValueChange={handleMinuteChange}
            disabled={!value}
          >
            <SelectTrigger className="w-[70px] h-8 text-sm">
              <SelectValue placeholder="mm" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {minutes.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {String(m).padStart(2, "0")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { DateTimePicker };
export type { DateTimePickerProps };
