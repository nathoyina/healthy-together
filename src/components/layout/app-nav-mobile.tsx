"use client";

import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  { href: "/dashboard", label: "Check-in" },
  { href: "/goals", label: "Habits" },
  { href: "/friends", label: "Friends" },
  { href: "/groups", label: "Groups" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppNavMobile() {
  const router = useRouter();

  return (
    <div className="sm:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
          aria-label="Open menu"
        >
          <Menu className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {links.map((l) => (
            <DropdownMenuItem
              key={l.href}
              onClick={() => {
                router.push(l.href);
              }}
            >
              {l.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
