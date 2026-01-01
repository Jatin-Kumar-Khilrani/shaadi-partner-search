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
  showAnyOption?: boolean
  anyOptionLabel?: string
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
  showAnyOption = false,
  anyOptionLabel = "Any / No Preference",
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  // Check if "any" is selected (special value meaning no preference)
  const isAnySelected = value.length === 1 && value[0] === 'any'
  
  // Filter out "any" for display purposes when showing selected options
  const selectedOptions = isAnySelected ? [] : options.filter((option) => value.includes(option.value))
  const allSelected = options.length > 0 && value.length === options.length

  const handleSelect = (optionValue: string) => {
    // If "any" was selected, clear it and add the new selection
    if (isAnySelected) {
      onValueChange([optionValue])
      return
    }
    
    if (value.includes(optionValue)) {
      onValueChange(value.filter((v) => v !== optionValue))
    } else {
      onValueChange([...value, optionValue])
    }
  }

  const handleAnySelect = () => {
    if (isAnySelected) {
      onValueChange([]) // Deselect "any"
    } else {
      onValueChange(['any']) // Select "any" and clear all other selections
    }
  }

  const handleSelectAll = () => {
    if (allSelected || isAnySelected) {
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
    if (isAnySelected) return anyOptionLabel
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
            {isAnySelected ? (
              <Badge
                variant="secondary"
                className="text-xs px-1.5 py-0.5 gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                {anyOptionLabel}
                <X
                  size={12}
                  className="cursor-pointer hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onValueChange([]); }}
                />
              </Badge>
            ) : selectedOptions.length > 0 ? (
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
              {/* "Any / No Preference" option at the top */}
              {showAnyOption && (
                <CommandItem
                  key="any-option"
                  value={anyOptionLabel}
                  onSelect={handleAnySelect}
                  className="border-b mb-1"
                >
                  <div className={cn(
                    "mr-2 h-4 w-4 border rounded-sm flex items-center justify-center",
                    isAnySelected 
                      ? "bg-green-600 border-green-600 text-white" 
                      : "border-input"
                  )}>
                    {isAnySelected && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </div>
                  <span className="font-medium text-green-700 dark:text-green-400">{anyOptionLabel}</span>
                </CommandItem>
              )}
              {/* Regular options - disabled when "Any" is selected */}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                  disabled={isAnySelected}
                  className={isAnySelected ? "opacity-50" : ""}
                >
                  <div className={cn(
                    "mr-2 h-4 w-4 border rounded-sm flex items-center justify-center",
                    value.includes(option.value) && !isAnySelected
                      ? "bg-primary border-primary text-primary-foreground" 
                      : "border-input"
                  )}>
                    {value.includes(option.value) && !isAnySelected && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </div>
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {(selectedOptions.length > 0 || isAnySelected) && (
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

export const DRINKING_HABIT_OPTIONS: MultiSelectOption[] = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" },
]

export const SMOKING_HABIT_OPTIONS: MultiSelectOption[] = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" },
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

// Cities by State - Comprehensive list for major states
export const CITIES_BY_STATE: Record<string, string[]> = {
  // Indian States
  'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Kadapa', 'Anantapur', 'Eluru', 'Ongole', 'Vizianagaram', 'Machilipatnam', 'Tenali', 'Proddatur', 'Chittoor', 'Hindupur', 'Srikakulam', 'Bhimavaram'],
  'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Bomdila', 'Ziro', 'Along', 'Tezu', 'Roing', 'Changlang'],
  'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Dhubri', 'North Lakhimpur', 'Karimganj', 'Sivasagar', 'Goalpara', 'Barpeta'],
  'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar', 'Munger', 'Chhapra', 'Samastipur', 'Bihar Sharif', 'Sasaram', 'Hajipur', 'Dehri', 'Siwan', 'Motihari', 'Nawada', 'Buxar'],
  'Chhattisgarh': ['Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Dhamtari', 'Mahasamund', 'Chirmiri', 'Dongargarh'],
  'Goa': ['Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Canacona', 'Quepem', 'Sanguem', 'Valpoi'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Nadiad', 'Morbi', 'Mehsana', 'Bharuch', 'Vapi', 'Navsari', 'Porbandar', 'Godhra', 'Bhuj', 'Palanpur', 'Veraval', 'Patan', 'Surendranagar'],
  'Haryana': ['Faridabad', 'Gurgaon', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula', 'Bhiwani', 'Sirsa', 'Bahadurgarh', 'Jind', 'Thanesar', 'Kaithal', 'Rewari', 'Palwal', 'Hansi', 'Narnaul'],
  'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Kullu', 'Manali', 'Hamirpur', 'Una', 'Bilaspur', 'Chamba', 'Nahan', 'Kangra', 'Baddi', 'Sundernagar', 'Paonta Sahib'],
  'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar', 'Chaibasa', 'Phusro', 'Dumka', 'Chirkunda', 'Madhupur', 'Chatra'],
  'Karnataka': ['Bangalore', 'Bengaluru', 'Mysore', 'Mysuru', 'Hubli', 'Mangalore', 'Belgaum', 'Belagavi', 'Gulbarga', 'Kalaburagi', 'Davangere', 'Bellary', 'Ballari', 'Shimoga', 'Shivamogga', 'Tumkur', 'Bijapur', 'Vijayapura', 'Raichur', 'Hassan', 'Udupi', 'Mandya', 'Kolar', 'Hospet', 'Chitradurga', 'Gadag', 'Bagalkot', 'Bidar', 'Karwar', 'Chikmagalur'],
  'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Kannur', 'Kottayam', 'Malappuram', 'Kasaragod', 'Pathanamthitta', 'Idukki', 'Wayanad', 'Ernakulam', 'Thalassery', 'Guruvayur', 'Perinthalmanna', 'Attingal', 'Ponnani'],
  'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa', 'Singrauli', 'Burhanpur', 'Khandwa', 'Morena', 'Bhind', 'Chhindwara', 'Guna', 'Shivpuri', 'Vidisha', 'Damoh', 'Mandsaur', 'Khargone', 'Neemuch', 'Pithampur', 'Hoshangabad', 'Itarsi'],
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Amravati', 'Kolhapur', 'Navi Mumbai', 'Vasai-Virar', 'Bhiwandi', 'Sangli', 'Malegaon', 'Jalgaon', 'Akola', 'Latur', 'Ahmednagar', 'Dhule', 'Chandrapur', 'Parbhani', 'Jalna', 'Ichalkaranji', 'Panvel', 'Satara', 'Beed', 'Yavatmal', 'Nanded', 'Wardha', 'Osmanabad', 'Gondia', 'Baramati', 'Ratnagiri', 'Hingoli'],
  'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Senapati', 'Ukhrul', 'Kakching', 'Moirang', 'Nambol', 'Mayang Imphal'],
  'Meghalaya': ['Shillong', 'Tura', 'Jowai', 'Nongstoin', 'Williamnagar', 'Baghmara', 'Resubelpara', 'Ampati', 'Mairang', 'Nongpoh'],
  'Mizoram': ['Aizawl', 'Lunglei', 'Champhai', 'Serchhip', 'Kolasib', 'Lawngtlai', 'Saiha', 'Mamit', 'Saitual'],
  'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Mon', 'Phek', 'Kiphire', 'Longleng'],
  'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Brahmapur', 'Sambalpur', 'Puri', 'Balasore', 'Baripada', 'Bhadrak', 'Jharsuguda', 'Bargarh', 'Angul', 'Koraput', 'Rayagada', 'Paradip', 'Kendrapara', 'Jagatsinghpur'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur', 'Batala', 'Moga', 'Abohar', 'Malerkotla', 'Khanna', 'Phagwara', 'Muktsar', 'Barnala', 'Rajpura', 'Firozpur', 'Kapurthala', 'Faridkot', 'Sangrur', 'Fazilka', 'Gurdaspur', 'Zirakpur', 'Kharar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Bikaner', 'Ajmer', 'Udaipur', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar', 'Pali', 'Sri Ganganagar', 'Tonk', 'Kishangarh', 'Beawar', 'Hanumangarh', 'Dhaulpur', 'Gangapur City', 'Sawai Madhopur', 'Churu', 'Jhunjhunu', 'Chittorgarh', 'Bundi', 'Nagaur', 'Barmer', 'Banswara', 'Jaisalmer', 'Mount Abu', 'Pushkar'],
  'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing', 'Mangan', 'Rangpo', 'Singtam', 'Jorethang', 'Nayabazar', 'Ravangla'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Trichy', 'Salem', 'Tirunelveli', 'Tiruppur', 'Vellore', 'Erode', 'Thoothukkudi', 'Thoothukudi', 'Dindigul', 'Thanjavur', 'Ranipet', 'Sivakasi', 'Karur', 'Udhagamandalam', 'Ooty', 'Hosur', 'Nagercoil', 'Kanchipuram', 'Kumbakonam', 'Cuddalore', 'Tiruvannamalai', 'Pollachi', 'Rajapalayam', 'Ambur', 'Tirupur', 'Pudukkottai', 'Vaniyambadi', 'Nagapattinam', 'Virudhunagar', 'Neyveli', 'Viluppuram'],
  'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet', 'Miryalaguda', 'Siddipet', 'Mancherial', 'Bodhan', 'Jagtial', 'Bhongir', 'Kamareddy', 'Sangareddy', 'Vikarabad', 'Medak', 'Jangaon', 'Medchal', 'Secunderabad', 'LB Nagar', 'Kukatpally', 'Gachibowli', 'Madhapur', 'HITEC City'],
  'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailashahar', 'Belonia', 'Ambassa', 'Khowai', 'Teliamura', 'Bishalgarh', 'Sonamura'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Prayagraj', 'Bareilly', 'Aligarh', 'Moradabad', 'Saharanpur', 'Gorakhpur', 'Noida', 'Greater Noida', 'Firozabad', 'Jhansi', 'Muzaffarnagar', 'Mathura', 'Budaun', 'Rampur', 'Shahjahanpur', 'Farrukhabad', 'Mau', 'Hapur', 'Etawah', 'Mirzapur', 'Bulandshahr', 'Sambhal', 'Amroha', 'Hardoi', 'Fatehpur', 'Raebareli', 'Orai', 'Sitapur', 'Bahraich', 'Modinagar', 'Unnao', 'Jaunpur', 'Lakhimpur', 'Hathras', 'Banda', 'Pilibhit', 'Barabanki', 'Khurja', 'Gonda', 'Mainpuri', 'Lalitpur', 'Etah', 'Deoria', 'Ujhani'],
  'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Nainital', 'Rishikesh', 'Kashipur', 'Rudrapur', 'Ramnagar', 'Almora', 'Mussoorie', 'Pithoragarh', 'Kotdwar', 'Pauri', 'Tehri', 'Lansdowne', 'Srinagar', 'Chamoli', 'Uttarkashi', 'Bageshwar', 'Champawat'],
  'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Kharagpur', 'Haldia', 'Baharampur', 'Raiganj', 'Krishnanagar', 'Jalpaiguri', 'Balurghat', 'Alipurduar', 'Cooch Behar', 'Midnapore', 'Bankura', 'Purulia', 'Raniganj', 'Darjeeling', 'Kalyani', 'Barrackpore', 'Barasat', 'Habra', 'Naihati', 'Serampore', 'Chandannagar', 'Rishra', 'Uttarpara'],
  'Delhi': ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi', 'Shahdara', 'Dwarka', 'Rohini', 'Pitampura', 'Janakpuri', 'Vikaspuri', 'Uttam Nagar', 'Karol Bagh', 'Lajpat Nagar', 'Greater Kailash', 'Vasant Kunj', 'Saket', 'Connaught Place', 'Nehru Place', 'Rajouri Garden', 'Chandni Chowk', 'Mayur Vihar', 'Preet Vihar', 'Kalkaji', 'Defence Colony'],
  'Chandigarh': ['Chandigarh', 'Manimajra', 'Mohali Extension', 'Industrial Area'],
  'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Sopore', 'Udhampur', 'Pulwama', 'Kupwara', 'Kathua', 'Poonch', 'Rajouri', 'Budgam', 'Ganderbal', 'Shopian', 'Kulgam', 'Bandipora', 'Leh', 'Kargil'],
  'Ladakh': ['Leh', 'Kargil', 'Diskit', 'Padum', 'Nubra', 'Turtuk', 'Hanle'],
  'Puducherry': ['Puducherry', 'Pondicherry', 'Karaikal', 'Mahe', 'Yanam', 'Villianur', 'Ozhukarai'],
  'Andaman and Nicobar Islands': ['Port Blair', 'Garacharma', 'Bambooflat', 'Prothrapur', 'Car Nicobar'],
  
  // US States
  'California': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Fresno', 'Oakland', 'Bakersfield', 'Anaheim', 'Santa Ana', 'Riverside', 'Stockton', 'Irvine', 'Chula Vista', 'Fremont', 'Santa Clara', 'Sunnyvale', 'Palo Alto', 'Mountain View', 'Cupertino'],
  'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi', 'Plano', 'Laredo', 'Lubbock', 'Garland', 'Irving', 'Frisco', 'McKinney', 'Amarillo', 'Grand Prairie', 'Brownsville', 'Killeen', 'Pasadena'],
  'New York': ['New York City', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse', 'Albany', 'New Rochelle', 'Mount Vernon', 'Schenectady', 'Utica', 'White Plains', 'Hempstead', 'Troy', 'Niagara Falls', 'Binghamton', 'Freeport', 'Valley Stream'],
  'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale', 'St. Petersburg', 'Hialeah', 'Tallahassee', 'Port St. Lucie', 'Cape Coral', 'Pembroke Pines', 'Hollywood', 'Miramar', 'Gainesville', 'Coral Springs'],
  'Illinois': ['Chicago', 'Aurora', 'Naperville', 'Joliet', 'Rockford', 'Springfield', 'Elgin', 'Peoria', 'Champaign', 'Waukegan', 'Cicero', 'Bloomington', 'Arlington Heights', 'Evanston', 'Schaumburg'],
  'Pennsylvania': ['Philadelphia', 'Pittsburgh', 'Allentown', 'Reading', 'Scranton', 'Bethlehem', 'Lancaster', 'Harrisburg', 'Altoona', 'Erie', 'York', 'Wilkes-Barre', 'Chester'],
  'Ohio': ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton', 'Parma', 'Canton', 'Youngstown', 'Lorain', 'Hamilton', 'Springfield'],
  'Georgia': ['Atlanta', 'Augusta', 'Columbus', 'Macon', 'Savannah', 'Athens', 'Sandy Springs', 'Roswell', 'Johns Creek', 'Albany', 'Warner Robins', 'Alpharetta', 'Marietta'],
  'Michigan': ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor', 'Lansing', 'Flint', 'Dearborn', 'Livonia', 'Troy', 'Westland', 'Farmington Hills', 'Kalamazoo'],
  'New Jersey': ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Edison', 'Woodbridge', 'Lakewood', 'Toms River', 'Hamilton', 'Trenton', 'Clifton', 'Camden', 'Brick', 'Cherry Hill', 'Passaic', 'Union City', 'Bayonne', 'East Orange', 'Franklin', 'North Bergen'],
  'Washington': ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue', 'Kent', 'Everett', 'Renton', 'Federal Way', 'Spokane Valley', 'Kirkland', 'Bellingham', 'Auburn', 'Redmond'],
  'Massachusetts': ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell', 'Brockton', 'New Bedford', 'Quincy', 'Lynn', 'Fall River', 'Newton', 'Somerville', 'Lawrence', 'Framingham'],
  'Virginia': ['Virginia Beach', 'Norfolk', 'Chesapeake', 'Richmond', 'Newport News', 'Alexandria', 'Hampton', 'Roanoke', 'Portsmouth', 'Suffolk', 'Lynchburg', 'Harrisonburg', 'Charlottesville'],
  'North Carolina': ['Charlotte', 'Raleigh', 'Greensboro', 'Durham', 'Winston-Salem', 'Fayetteville', 'Cary', 'Wilmington', 'High Point', 'Concord', 'Greenville', 'Asheville', 'Gastonia'],
  'Arizona': ['Phoenix', 'Tucson', 'Mesa', 'Chandler', 'Gilbert', 'Glendale', 'Scottsdale', 'Peoria', 'Tempe', 'Surprise', 'Yuma', 'Avondale', 'Goodyear', 'Flagstaff'],
  'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Centennial', 'Boulder', 'Greeley', 'Longmont'],
  'District of Columbia': ['Washington D.C.', 'Capitol Hill', 'Georgetown', 'Dupont Circle', 'Adams Morgan', 'Foggy Bottom', 'Navy Yard', 'Columbia Heights'],
  
  // UK
  'England': ['London', 'Birmingham', 'Manchester', 'Liverpool', 'Leeds', 'Sheffield', 'Bristol', 'Leicester', 'Coventry', 'Bradford', 'Nottingham', 'Newcastle', 'Southampton', 'Portsmouth', 'Reading', 'Cambridge', 'Oxford', 'Milton Keynes', 'Brighton', 'Bournemouth', 'Norwich', 'Plymouth'],
  'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'Stirling', 'Perth', 'Paisley', 'Livingston', 'Cumbernauld', 'Dunfermline', 'Kilmarnock', 'Ayr', 'Greenock'],
  'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham', 'Barry', 'Neath', 'Bridgend', 'Port Talbot', 'Llanelli', 'Rhondda', 'Caerphilly', 'Pontypridd'],
  'Northern Ireland': ['Belfast', 'Derry', 'Londonderry', 'Lisburn', 'Newtownabbey', 'Bangor', 'Craigavon', 'Castlereagh', 'Ballymena', 'Newry', 'Newtownards', 'Carrickfergus', 'Coleraine'],
  'Greater London': ['Westminster', 'Camden', 'Islington', 'Hackney', 'Tower Hamlets', 'Greenwich', 'Lewisham', 'Southwark', 'Lambeth', 'Wandsworth', 'Hammersmith', 'Kensington', 'Brent', 'Ealing', 'Hounslow', 'Richmond', 'Kingston', 'Merton', 'Sutton', 'Croydon', 'Bromley', 'Bexley', 'Havering', 'Barking', 'Redbridge', 'Newham', 'Waltham Forest', 'Haringey', 'Enfield', 'Barnet', 'Harrow', 'Hillingdon'],
  'West Midlands': ['Birmingham', 'Coventry', 'Wolverhampton', 'Solihull', 'Dudley', 'Walsall', 'West Bromwich', 'Sutton Coldfield', 'Stourbridge', 'Halesowen'],
  'Greater Manchester': ['Manchester', 'Salford', 'Bolton', 'Bury', 'Oldham', 'Rochdale', 'Stockport', 'Tameside', 'Trafford', 'Wigan', 'Altrincham', 'Ashton-under-Lyne'],
  
  // Canada
  'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Brampton', 'Hamilton', 'London', 'Markham', 'Vaughan', 'Kitchener', 'Windsor', 'Richmond Hill', 'Oakville', 'Burlington', 'Oshawa', 'Barrie', 'Guelph', 'Cambridge', 'Waterloo', 'St. Catharines', 'Kingston'],
  'British Columbia': ['Vancouver', 'Surrey', 'Burnaby', 'Richmond', 'Coquitlam', 'Kelowna', 'Victoria', 'Langley', 'Abbotsford', 'Nanaimo', 'Kamloops', 'Prince George', 'Chilliwack', 'New Westminster', 'Delta'],
  'Alberta': ['Calgary', 'Edmonton', 'Red Deer', 'Lethbridge', 'St. Albert', 'Medicine Hat', 'Grande Prairie', 'Airdrie', 'Spruce Grove', 'Leduc', 'Fort McMurray', 'Lloydminster'],
  'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau', 'Longueuil', 'Sherbrooke', 'Saguenay', 'Levis', 'Trois-Rivieres', 'Terrebonne', 'Saint-Jean-sur-Richelieu', 'Repentigny', 'Brossard', 'Drummondville'],
  'Manitoba': ['Winnipeg', 'Brandon', 'Steinbach', 'Thompson', 'Portage la Prairie', 'Winkler', 'Selkirk', 'Morden'],
  'Saskatchewan': ['Saskatoon', 'Regina', 'Prince Albert', 'Moose Jaw', 'Swift Current', 'Yorkton', 'North Battleford', 'Estevan', 'Weyburn'],
  'Nova Scotia': ['Halifax', 'Dartmouth', 'Sydney', 'Truro', 'New Glasgow', 'Glace Bay', 'Kentville', 'Amherst', 'Bridgewater'],
  
  // Australia
  'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Maitland', 'Coffs Harbour', 'Wagga Wagga', 'Port Macquarie', 'Tamworth', 'Orange', 'Dubbo', 'Albury', 'Bathurst', 'Lismore', 'Nowra'],
  'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Mildura', 'Warrnambool', 'Wodonga', 'Traralgon', 'Sunbury', 'Melton', 'Frankston', 'Dandenong'],
  'Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Townsville', 'Cairns', 'Toowoomba', 'Mackay', 'Rockhampton', 'Bundaberg', 'Hervey Bay', 'Gladstone', 'Mount Isa'],
  'Western Australia': ['Perth', 'Fremantle', 'Mandurah', 'Bunbury', 'Geraldton', 'Kalgoorlie', 'Albany', 'Broome', 'Rockingham', 'Joondalup'],
  'South Australia': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Murray Bridge', 'Port Augusta', 'Port Lincoln', 'Port Pirie', 'Victor Harbor'],
  'Tasmania': ['Hobart', 'Launceston', 'Devonport', 'Burnie', 'Kingston', 'Ulverstone', 'Glenorchy', 'Clarence'],
  
  // UAE
  'Abu Dhabi': ['Abu Dhabi City', 'Al Ain', 'Al Dhafra', 'Al Ruwais', 'Madinat Zayed', 'Ghayathi', 'Liwa', 'Yas Island', 'Saadiyat Island', 'Khalifa City'],
  'Dubai': ['Dubai City', 'Deira', 'Bur Dubai', 'Jumeirah', 'Dubai Marina', 'Downtown Dubai', 'Business Bay', 'JBR', 'JLT', 'DIFC', 'Palm Jumeirah', 'Al Barsha', 'Al Quoz', 'Jebel Ali', 'Arabian Ranches', 'Emirates Hills', 'Dubai Silicon Oasis', 'Al Nahda', 'Karama', 'Satwa'],
  'Sharjah': ['Sharjah City', 'Al Nahda', 'Al Majaz', 'Al Khan', 'Al Qasimia', 'Muwaileh', 'Industrial Area', 'Al Taawun', 'Al Mamzar', 'Khorfakkan', 'Kalba', 'Dibba Al-Hisn'],
  'Ajman': ['Ajman City', 'Al Nuaimiya', 'Al Rashidiya', 'Al Jurf', 'Masfout', 'Manama'],
  'Ras Al Khaimah': ['Ras Al Khaimah City', 'Al Nakheel', 'Al Hamra', 'Al Dhait', 'Khuzam', 'Al Mairid', 'Al Rams', 'Digdaga'],
  'Fujairah': ['Fujairah City', 'Dibba Al-Fujairah', 'Masafi', 'Murbah', 'Al Bidya', 'Al Hail'],
  
  // Singapore
  'Singapore': ['Singapore', 'Jurong', 'Tampines', 'Bedok', 'Woodlands', 'Ang Mo Kio', 'Toa Payoh', 'Bishan', 'Clementi', 'Bukit Batok', 'Pasir Ris', 'Punggol', 'Sengkang', 'Serangoon', 'Hougang', 'Yishun', 'Orchard', 'Marina Bay', 'Sentosa', 'Changi'],
  
  // Germany
  'Baden-Württemberg': ['Stuttgart', 'Mannheim', 'Karlsruhe', 'Freiburg', 'Heidelberg', 'Ulm', 'Pforzheim', 'Reutlingen', 'Esslingen', 'Ludwigsburg', 'Konstanz', 'Tübingen', 'Villingen-Schwenningen', 'Aalen', 'Heilbronn'],
  'Bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg', 'Ingolstadt', 'Würzburg', 'Fürth', 'Erlangen', 'Bamberg', 'Bayreuth', 'Landshut', 'Passau', 'Rosenheim', 'Neu-Ulm', 'Schweinfurt'],
  'Berlin': ['Berlin', 'Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Charlottenburg', 'Friedrichshain', 'Neukölln', 'Schöneberg', 'Steglitz', 'Spandau', 'Tempelhof', 'Wilmersdorf'],
  'Hamburg': ['Hamburg', 'Altona', 'Eimsbüttel', 'Hamburg-Nord', 'Wandsbek', 'Bergedorf', 'Harburg', 'Hamburg-Mitte'],
  'Hesse': ['Frankfurt', 'Wiesbaden', 'Kassel', 'Darmstadt', 'Offenbach', 'Hanau', 'Marburg', 'Gießen', 'Fulda', 'Bad Homburg', 'Rüsselsheim'],
  'North Rhine-Westphalia': ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen', 'Duisburg', 'Bochum', 'Wuppertal', 'Bielefeld', 'Bonn', 'Münster', 'Gelsenkirchen', 'Mönchengladbach', 'Aachen', 'Krefeld', 'Oberhausen', 'Hagen', 'Hamm', 'Leverkusen', 'Solingen', 'Herne'],
}

// Helper function to get cities for a state
export const getCitiesForState = (state: string): string[] => {
  return CITIES_BY_STATE[state] || []
}

// Helper function to get city options for a state
export const getCityOptionsForState = (state: string): MultiSelectOption[] => {
  const cities = getCitiesForState(state)
  return cities.map(city => ({ value: city, label: city }))
}

// Helper function to get city options for multiple states
export const getCityOptionsForStates = (states: string[]): MultiSelectOption[] => {
  const cities: MultiSelectOption[] = []
  const seenCities = new Set<string>()

  states.forEach(state => {
    const stateCities = getCitiesForState(state)
    stateCities.forEach(city => {
      const cityKey = `${city}-${state}`
      if (!seenCities.has(cityKey)) {
        seenCities.add(cityKey)
        cities.push({ 
          value: city, 
          label: states.length > 1 ? `${city} (${state})` : city 
        })
      }
    })
  })

  return cities.sort((a, b) => a.label.localeCompare(b.label))
}
