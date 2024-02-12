"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button, ButtonProps } from "@/components/ui/button";

export function ThemeToggle({ variant = "ghost", size = "icon" }: ButtonProps) {
  const { setTheme, theme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.5rem] w-[1.3rem] dark:hidden" />
      <Moon className="hidden h-5 w-5 dark:block" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
