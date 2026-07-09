import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>((props, ref) => {
  const { className, decorative = true, ...rest } = props as React.ComponentPropsWithoutRef<
    typeof SeparatorPrimitive.Root
  >;

  // orientation is a union type defined by Radix; provide a default safely
  const orientation = (rest as any).orientation ?? "horizontal";

  return (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className,
      )}
      {...(rest as any)}
    />
  );
});
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };