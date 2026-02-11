import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-11 w-full rounded-lg border-2 border-[#d7caca] bg-[#f6f2f2] px-3 py-2 text-sm shadow-none transition-colors placeholder:text-muted-foreground focus:border-[#c87c85] focus:outline-none focus:ring-0 focus:shadow-none focus-visible:border-[#c87c85] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
