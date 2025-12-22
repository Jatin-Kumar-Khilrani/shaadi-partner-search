import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { Calendar as CalendarIcon } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  value?: string // ISO date string (YYYY-MM-DD)
  onChange: (value: string) => void
  placeholder?: string
  minDate?: Date
  maxDate?: Date
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  minDate,
  maxDate,
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  // Convert ISO date to DD/MM/YYYY for display
  React.useEffect(() => {
    if (value) {
      const date = new Date(value)
      if (isValid(date)) {
        setInputValue(format(date, "dd/MM/yyyy"))
      }
    } else {
      setInputValue("")
    }
  }, [value])

  // Parse DD/MM/YYYY input and convert to ISO
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value
    
    // Allow only numbers and slashes
    input = input.replace(/[^\d/]/g, "")
    
    // Auto-add slashes
    if (input.length === 2 && !input.includes("/")) {
      input = input + "/"
    } else if (input.length === 5 && input.split("/").length === 2) {
      input = input + "/"
    }
    
    // Limit to DD/MM/YYYY format (10 chars)
    if (input.length > 10) {
      input = input.slice(0, 10)
    }
    
    setInputValue(input)
    
    // Try to parse complete date
    if (input.length === 10) {
      const parsed = parse(input, "dd/MM/yyyy", new Date())
      if (isValid(parsed)) {
        // Check date bounds
        if (minDate && parsed < minDate) return
        if (maxDate && parsed > maxDate) return
        
        onChange(format(parsed, "yyyy-MM-dd"))
      }
    }
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"))
      setOpen(false)
    }
  }

  const selectedDate = value ? new Date(value) : undefined

  return (
    <div className={cn("relative", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-10"
          />
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
            >
              <CalendarIcon size={18} className="text-muted-foreground" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0 z-[9999]" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true
              if (maxDate && date > maxDate) return true
              return false
            }}
            defaultMonth={selectedDate || maxDate}
            initialFocus
            captionLayout="dropdown"
            startMonth={new Date(1950, 0)}
            endMonth={maxDate || new Date()}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
