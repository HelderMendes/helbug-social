import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDate, formatDistanceToNowStrict } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(from: Date) {
  const currentDate = new Date();

  //Last 24 hours
  if (currentDate.getTime() - from.getTime() < 24 * 60 * 60 * 1000) {
    return formatDistanceToNowStrict(from, { addSuffix: true });
  } else {
    if (currentDate.getFullYear() === from.getFullYear()) {
      return formatDate(from, "d MMM");
    } else {
      return formatDate(from, "d MMM, YYYY");
    }
  }
}

export function formatNumber(n: number): string {
  return Intl.NumberFormat("nl-NL", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}
