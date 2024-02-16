"use client";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Menu, XIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MenuProps } from "./header";
import { ThemeToggle } from "./theme-toggle";
import { Button, buttonVariants } from "./ui/button";

export const MobileMenu = ({ pages, collections }: MenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="block md:hidden px-2">
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger>
          <div className="p-2">
            <Menu aria-label="open menu" />
          </div>
        </DrawerTrigger>
        <DrawerContent>
          <ul className="flex flex-col gap-2 pt-2  px-4">
            {pages.map(({ title, slug }) => (
              <li key={slug}>
                <Link
                  onClick={() => setOpen(false)}
                  className={
                    buttonVariants({ variant: "secondary" }) +
                    " capitalize w-full"
                  }
                  href={`/${slug}`}
                >
                  {title}
                </Link>
              </li>
            ))}
            {collections.map((collection) => (
              <li key={collection}>
                <Link
                  onClick={() => setOpen(false)}
                  className={
                    buttonVariants({ variant: "secondary" }) +
                    " capitalize w-full"
                  }
                  href={`/${collection}`}
                >
                  {collection}
                </Link>
              </li>
            ))}
          </ul>
          <DrawerFooter>
            <div className="w-full justify-end flex gap-4">
              <ThemeToggle variant="outline" size="default" />

              <Button asChild variant="outline">
                <DrawerClose>
                  <XIcon />
                </DrawerClose>
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
};
