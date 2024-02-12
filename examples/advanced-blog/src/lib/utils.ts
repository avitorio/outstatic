import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function absoluteUrl(path: string) {
  return `${
    process.env?.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  }${path}`;
}

export function ogUrl(title: string) {
  // Get domain only without last slash
  const siteUrl = absoluteUrl("/")
    .replace(/(^\w+:|^)\/\//, "")
    .replace(/\/$/, "");
  return absoluteUrl(`/api/og?title=${title}&siteUrl=${siteUrl}`);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
