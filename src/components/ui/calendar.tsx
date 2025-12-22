import { ComponentProps } from "react"
import ChevronLeft from "lucide-react/dist/esm/icons/chevron-left"
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium hidden",
        dropdowns: "flex gap-2 justify-center",
        dropdown: "appearance-none bg-transparent border border-input rounded-md px-2 py-1 text-sm font-medium cursor-pointer hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
        dropdown_root: "relative inline-flex items-center",
        months_dropdown: "appearance-none bg-transparent border border-input rounded-md px-2 py-1 text-sm font-medium cursor-pointer hover:bg-accent",
        years_dropdown: "appearance-none bg-transparent border border-input rounded-md px-2 py-1 text-sm font-medium cursor-pointer hover:bg-accent",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center flex-1",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 flex-1 h-9 w-9",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal aria-selected:opacity-100 w-full"
        ),
        range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
        today: "bg-accent text-accent-foreground rounded-md",
        outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          if (orientation === "left") {
            return <ChevronLeft className="size-4" {...props} />
          }
          return <ChevronRight className="size-4" {...props} />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
