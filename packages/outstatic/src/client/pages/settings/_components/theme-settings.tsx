import { cn } from "@/utils/ui/cn";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { Button } from "@/components/ui/shadcn/button";

export const themes = [
   {
      icon: Monitor,
      name: "system"
   },
   {
      icon: Moon,
      name: "dark"
   },
   {
      icon: Sun,
      name: "light"
   },
]

export const ThemeSettings = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
   const { theme, setTheme } = useTheme()
   console.log(theme)
  return <div className={cn("flex items-center gap-3 flex-wrap", className)} {...props}>
    {themes.map(t => (
      <Button
         onClick={() => setTheme(t.name)}
         variant={theme === t.name ? "default" : "outline"}
         className="gap-2">
         <t.icon className="size-4" />
         <span className="capitalize">{t.name}</span>
      </Button>
    ))}
  </div>
};

