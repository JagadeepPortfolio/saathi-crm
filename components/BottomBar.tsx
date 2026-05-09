"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users } from "lucide-react";

const TABS = [
  { href: "/", label: "Today", icon: Home },
  { href: "/customers", label: "Customers", icon: Users },
] as const;

export default function BottomBar() {
  const pathname = usePathname();
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="sticky bottom-0 z-10 flex border-t border-border bg-bg/95 backdrop-blur"
    >
      {TABS.map((tab) => {
        const active =
          tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium ${
              active ? "text-primary" : "text-text-muted"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 1.8} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
