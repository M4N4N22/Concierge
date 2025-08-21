// components/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

import {
  Folder,
  Brain,
  Lock,
  FileText,
  Search,
  LineChart,
  User,
  Settings,
  Circle,
  Sparkles,
} from "lucide-react";

const sections = [
  {
    title: "Vault",
    icon: Folder,
    items: [
      { name: "My Files", href: "/dashboard/vault/my-files", icon: FileText },
      {
        name: "AI Insights",
        href: "/dashboard/vault/insights",
        icon: Sparkles,
      },
      { name: "Search", href: "/dashboard/vault/search", icon: Search },
    ],
  },
  {
    title: "My Agent",
    icon: Brain,
    items: [
      { name: "Overview", href: "/dashboard/agent/overview", icon: User },
      { name: "Learning", href: "/dashboard/agent/learning", icon: Brain },
      {
        name: "Recommendations",
        href: "/dashboard/agent/recommendations",
        icon: LineChart,
      },
    ],
  },
  {
    title: "Future Sections",
    disabled: false,
    icon: Settings,
    items: [
      { name: "Specializations", href: "#", icon: Circle },
      { name: "Marketplace", href: "#", icon: Circle },
      { name: "Integrations", href: "#", icon: Circle },
      { name: "Privacy & Monetization", href: "#", icon: Lock },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    Vault: true,
    "My Agent": true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="w-64 h-full border-r p-4 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center rounded-md bg-gradient-to-br from-primary to-secondary text-white font-bold text-lg">
            C
          </div>
          <span className="font-semibold text-lg">Concierge</span>
        </Link>
      </div>

      {sections.map((section) => {
        const Icon = section.icon;
        const isInsideSection = section.items.some((item) =>
          pathname.startsWith(item.href)
        );

        return (
          <div key={section.title} className="mb-2">
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.title)}
              disabled={section.disabled}
              className={cn(
                "flex items-center justify-between w-full p-3 rounded-md text-sm font-medium",
                section.disabled
                  ? "text-muted cursor-not-allowed"
                  : isInsideSection
                  ? "bg-card"
                  : "hover:bg-card/90 text-muted"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon
                  className={cn(
                    "h-4 w-4",
                    isInsideSection ? "text-primary" : "text-muted"
                  )}
                />
                {section.title}
              </span>
              {!section.disabled && (
                <span className="text-xs">
                  {openSections[section.title] ? "–" : "+"}
                </span>
              )}
            </button>

            {/* Items */}
            {openSections[section.title] && (
              <ul className="mt-1 space-y-2 pl-6">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const ItemIcon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                          section.disabled
                            ? "text-muted cursor-not-allowed"
                            : isActive
                            ? "bg-card font-medium"
                            : "hover:bg-card text-muted"
                        )}
                      >
                        <ItemIcon
                          className={cn(
                            "h-4 w-4",
                            isActive ? "text-primary" : "text-muted"
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
