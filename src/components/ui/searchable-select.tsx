"use client"

import * as React from "react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronsUpDownIcon from "lucide-react/dist/esm/icons/chevrons-up-down"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SearchableSelectOption[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[350px]" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[280px] overflow-y-auto scroll-smooth">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Pre-defined education options for reuse
export const EDUCATION_OPTIONS: SearchableSelectOption[] = [
  { value: "10th", label: "10th Standard" },
  { value: "12th", label: "12th Standard" },
  { value: "diploma", label: "Diploma" },
  { value: "graduate", label: "Graduate" },
  { value: "btech-be", label: "B.Tech/B.E." },
  { value: "bba", label: "BBA" },
  { value: "bca", label: "BCA" },
  { value: "bsc", label: "B.Sc" },
  { value: "bcom", label: "B.Com" },
  { value: "ba", label: "B.A." },
  { value: "llb", label: "LLB" },
  { value: "post-graduate", label: "Post Graduate" },
  { value: "mtech-me", label: "M.Tech/M.E." },
  { value: "mba", label: "MBA" },
  { value: "mca", label: "MCA" },
  { value: "msc", label: "M.Sc" },
  { value: "mcom", label: "M.Com" },
  { value: "ma", label: "M.A." },
  { value: "llm", label: "LLM" },
  { value: "phd", label: "PhD/Doctorate" },
  { value: "mbbs", label: "MBBS" },
  { value: "md-ms", label: "MD/MS" },
  { value: "bds", label: "BDS" },
  { value: "bams-bhms", label: "BAMS/BHMS" },
  { value: "ca", label: "Chartered Accountant (CA)" },
  { value: "cs", label: "Company Secretary (CS)" },
  { value: "cfa", label: "CFA" },
  { value: "b-pharma", label: "B.Pharma" },
  { value: "m-pharma", label: "M.Pharma" },
  { value: "b-ed", label: "B.Ed" },
  { value: "other", label: "Other" },
]

// Pre-defined employment status options for reuse (simplified from occupation list)
export const OCCUPATION_OPTIONS: SearchableSelectOption[] = [
  { value: "employed", label: "Employed" },
  { value: "self-employed", label: "Self-Employed" },
  { value: "business-owner", label: "Business Owner" },
  { value: "govt-employee", label: "Government Employee" },
  { value: "student", label: "Student" },
  { value: "homemaker", label: "Homemaker" },
  { value: "retired", label: "Retired" },
  { value: "not-working", label: "Not Working" },
]
