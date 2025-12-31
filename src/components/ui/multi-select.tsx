"use client"

import * as React from "react"
import { X } from "@phosphor-icons/react"
import CheckIcon from "lucide-react/dist/esm/icons/check"
import ChevronsUpDownIcon from "lucide-react/dist/esm/icons/chevrons-up-down"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  maxDisplay?: number
  showSelectAll?: boolean
  selectAllLabel?: string
  clearAllLabel?: string
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
  maxDisplay = 3,
  showSelectAll = false,
  selectAllLabel = "Select All",
  clearAllLabel = "Clear All",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const selectedOptions = options.filter((option) => value.includes(option.value))
  const allSelected = options.length > 0 && value.length === options.length

  const handleSelect = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue))
    } else {
      onValueChange([...value, optionValue])
    }
  }

  const handleSelectAll = () => {
    if (allSelected) {
      onValueChange([])
    } else {
      onValueChange(options.map(o => o.value))
    }
  }

  const handleRemove = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange(value.filter((v) => v !== optionValue))
  }

  const displayText = () => {
    if (selectedOptions.length === 0) return placeholder
    if (selectedOptions.length <= maxDisplay) {
      return selectedOptions.map((o) => o.label).join(", ")
    }
    return `${selectedOptions.slice(0, maxDisplay).map((o) => o.label).join(", ")} +${selectedOptions.length - maxDisplay} more`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal min-h-[40px] h-auto", className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1 text-left">
            {selectedOptions.length > 0 ? (
              selectedOptions.length <= 2 ? (
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="text-xs px-1.5 py-0.5 gap-1"
                  >
                    {option.label}
                    <X
                      size={12}
                      className="cursor-pointer hover:text-destructive"
                      onClick={(e) => handleRemove(option.value, e)}
                    />
                  </Badge>
                ))
              ) : (
                <span className="text-sm truncate">
                  {selectedOptions.length} selected
                </span>
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 max-h-[350px] z-[9999]" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          {showSelectAll && options.length > 0 && (
            <div className="p-2 border-b">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={handleSelectAll}
              >
                {allSelected ? clearAllLabel : selectAllLabel}
              </Button>
            </div>
          )}
          <CommandList className="max-h-[280px] overflow-y-auto scroll-smooth">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div className={cn(
                    "mr-2 h-4 w-4 border rounded-sm flex items-center justify-center",
                    value.includes(option.value) 
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-input"
                  )}>
                    {value.includes(option.value) && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {selectedOptions.length > 0 && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => onValueChange([])}
            >
              Clear all
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Pre-defined options for partner preferences

export const MARITAL_STATUS_OPTIONS: MultiSelectOption[] = [
  { value: "never-married", label: "Never Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "awaiting-divorce", label: "Awaiting Divorce" },
]

export const EDUCATION_OPTIONS: MultiSelectOption[] = [
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
  { value: "post-graduate", label: "Post Graduate" },
  { value: "mba", label: "MBA" },
  { value: "mca", label: "MCA" },
  { value: "mtech-me", label: "M.Tech/M.E." },
  { value: "phd", label: "PhD/Doctorate" },
  { value: "mbbs", label: "MBBS" },
  { value: "md-ms", label: "MD/MS" },
  { value: "ca", label: "CA" },
  { value: "other", label: "Other" },
]

export const EMPLOYMENT_STATUS_OPTIONS: MultiSelectOption[] = [
  { value: "employed", label: "Employed" },
  { value: "self-employed", label: "Self-Employed" },
  { value: "business-owner", label: "Business Owner" },
  { value: "govt-employee", label: "Government Employee" },
  { value: "student", label: "Student" },
  { value: "homemaker", label: "Homemaker" },
  { value: "not-working", label: "Not Working" },
]

export const RELIGION_OPTIONS: MultiSelectOption[] = [
  { value: "Hindu", label: "Hindu" },
  { value: "Muslim", label: "Muslim" },
  { value: "Sikh", label: "Sikh" },
  { value: "Christian", label: "Christian" },
  { value: "Buddhist", label: "Buddhist" },
  { value: "Jain", label: "Jain" },
  { value: "Other", label: "Other" },
]

export const MOTHER_TONGUE_OPTIONS: MultiSelectOption[] = [
  { value: "Hindi", label: "Hindi" },
  { value: "English", label: "English" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Gujarati", label: "Gujarati" },
  { value: "Marathi", label: "Marathi" },
  { value: "Tamil", label: "Tamil" },
  { value: "Telugu", label: "Telugu" },
  { value: "Kannada", label: "Kannada" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Bengali", label: "Bengali" },
  { value: "Odia", label: "Odia" },
  { value: "Urdu", label: "Urdu" },
  { value: "Bhojpuri", label: "Bhojpuri" },
  { value: "Rajasthani", label: "Rajasthani" },
  { value: "Haryanvi", label: "Haryanvi" },
  { value: "Assamese", label: "Assamese" },
  { value: "Sindhi", label: "Sindhi" },
  { value: "Konkani", label: "Konkani" },
  { value: "Nepali", label: "Nepali" },
  { value: "Other", label: "Other" },
]

export const OCCUPATION_PROFESSION_OPTIONS: MultiSelectOption[] = [
  { value: "Software Engineer", label: "Software Engineer" },
  { value: "Doctor", label: "Doctor" },
  { value: "Lawyer", label: "Lawyer" },
  { value: "Teacher", label: "Teacher" },
  { value: "Professor", label: "Professor" },
  { value: "Engineer", label: "Engineer" },
  { value: "Accountant", label: "Accountant" },
  { value: "CA", label: "Chartered Accountant" },
  { value: "Banker", label: "Banker" },
  { value: "Manager", label: "Manager" },
  { value: "Business Owner", label: "Business Owner" },
  { value: "Government Employee", label: "Government Employee" },
  { value: "IAS/IPS/IFS", label: "IAS/IPS/IFS" },
  { value: "Police", label: "Police" },
  { value: "Army/Navy/Air Force", label: "Army/Navy/Air Force" },
  { value: "Architect", label: "Architect" },
  { value: "Scientist", label: "Scientist" },
  { value: "Researcher", label: "Researcher" },
  { value: "Nurse", label: "Nurse" },
  { value: "Pharmacist", label: "Pharmacist" },
  { value: "Pilot", label: "Pilot" },
  { value: "Farmer", label: "Farmer" },
  { value: "Artist", label: "Artist" },
  { value: "Designer", label: "Designer" },
  { value: "Other", label: "Other" },
]

export const COUNTRY_OPTIONS: MultiSelectOption[] = [
  { value: "India", label: "🇮🇳 India" },
  { value: "United States", label: "🇺🇸 United States" },
  { value: "United Kingdom", label: "🇬🇧 United Kingdom" },
  { value: "Canada", label: "🇨🇦 Canada" },
  { value: "Australia", label: "🇦🇺 Australia" },
  { value: "UAE", label: "🇦🇪 UAE" },
  { value: "Singapore", label: "🇸🇬 Singapore" },
  { value: "Germany", label: "🇩🇪 Germany" },
  { value: "New Zealand", label: "🇳🇿 New Zealand" },
  { value: "Saudi Arabia", label: "🇸🇦 Saudi Arabia" },
  { value: "Qatar", label: "🇶🇦 Qatar" },
  { value: "Kuwait", label: "🇰🇼 Kuwait" },
  { value: "Oman", label: "🇴🇲 Oman" },
  { value: "Bahrain", label: "🇧🇭 Bahrain" },
  { value: "Malaysia", label: "🇲🇾 Malaysia" },
  { value: "Netherlands", label: "🇳🇱 Netherlands" },
  { value: "France", label: "🇫🇷 France" },
  { value: "Ireland", label: "🇮🇪 Ireland" },
  { value: "Switzerland", label: "🇨🇭 Switzerland" },
  { value: "Japan", label: "🇯🇵 Japan" },
  { value: "South Korea", label: "🇰🇷 South Korea" },
  { value: "Hong Kong", label: "🇭🇰 Hong Kong" },
  { value: "Other", label: "🌍 Other" },
]

export const DIET_PREFERENCE_OPTIONS: MultiSelectOption[] = [
  { value: "veg", label: "Vegetarian" },
  { value: "non-veg", label: "Non-Vegetarian" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "jain", label: "Jain" },
]

// Function to get state options based on selected countries
export const getStateOptionsForCountries = (countries: string[]): MultiSelectOption[] => {
  const STATES_BY_COUNTRY: Record<string, string[]> = {
    'India': [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
      'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 
      'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Andaman and Nicobar Islands', 'Chandigarh', 'Delhi', 
      'Jammu and Kashmir', 'Ladakh', 'Puducherry'
    ],
    'United States': [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 
      'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 
      'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 
      'Texas', 'Washington', 'District of Columbia'
    ],
    'United Kingdom': [
      'England', 'Scotland', 'Wales', 'Northern Ireland',
      'Greater London', 'West Midlands', 'Greater Manchester'
    ],
    'Canada': [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 
      'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 
      'Quebec', 'Saskatchewan'
    ],
    'Australia': [
      'New South Wales', 'Victoria', 'Queensland', 'Western Australia', 
      'South Australia', 'Tasmania'
    ],
    'UAE': [
      'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah'
    ],
    'Singapore': ['Singapore'],
    'Germany': [
      'Baden-Württemberg', 'Bavaria', 'Berlin', 'Hamburg', 'Hesse', 
      'North Rhine-Westphalia'
    ],
  }

  const states: MultiSelectOption[] = []
  const seenStates = new Set<string>()

  countries.forEach(country => {
    const countryStates = STATES_BY_COUNTRY[country] || []
    countryStates.forEach(state => {
      if (!seenStates.has(state)) {
        seenStates.add(state)
        states.push({ 
          value: state, 
          label: countries.length > 1 ? `${state} (${country})` : state 
        })
      }
    })
  })

  return states.sort((a, b) => a.label.localeCompare(b.label))
}
