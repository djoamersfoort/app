import { ReactNode } from "react";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import Icon from "./icon";

/**
 * A titled block on a screen: icon, heading, optional trailing action.
 *
 * The header sits *outside* any card so a section can hold a horizontal
 * scroller that bleeds to the screen edge, which the card-wrapped predecessor
 * could not do.
 */
export default function Section({
  title,
  icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <VStack className={`gap-2 ${className ?? ""}`}>
      <HStack className="items-center gap-2 px-4">
        <Icon name={icon as never} size={18} className="text-primary" />
        <Heading size="sm" className="flex-1 text-foreground">
          {title}
        </Heading>
        {action}
      </HStack>
      {children}
    </VStack>
  );
}
