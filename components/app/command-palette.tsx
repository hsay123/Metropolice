"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { Role } from "@/lib/api/types";

export type PaletteItem = {
  /** Group heading, e.g. "Go to". */
  group: string;
  label: string;
  href: string;
  /** Optional right-aligned hint, e.g. "G J". */
  shortcut?: string;
};

/**
 * CommandPalette — the top bar's search (max 320px) opens this. It exists so a
 * reviewer or a contributor can move without reaching for the mouse; it only
 * routes, it never performs a money action from a keystroke.
 */
export function CommandPalette({
  open,
  onOpenChange,
  items,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: PaletteItem[];
  role: Role;
}) {
  const router = useRouter();

  const groups = React.useMemo(() => {
    const map = new Map<string, PaletteItem[]>();
    for (const item of items) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [items]);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Jump to a screen in this workspace."
    >
      <Command>
        <CommandInput placeholder="Search screens and actions" aria-label="Search" />
        <CommandList>
          <CommandEmpty>No matches in the {role} workspace.</CommandEmpty>
          {groups.map(([group, groupItems]) => (
            <CommandGroup key={group} heading={group}>
              {groupItems.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.group} ${item.label}`}
                  onSelect={() => go(item.href)}
                >
                  {item.label}
                  {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
