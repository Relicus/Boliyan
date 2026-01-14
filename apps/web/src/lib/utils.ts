import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBidderLocationMock(bidderId: string) {
  const hash = bidderId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const distance = Number(((hash % 40) / 10 + 1.1).toFixed(1));
  const locations = ["Satellite Town, Sargodha", "Model Town, Lahore", "DHA, Karachi", "Blue Area, Islamabad", "Civil Lines, Faisalabad", "Cantt, Rawalpindi"];
  const location = locations[hash % locations.length];
  const duration = Math.round(distance * 2.5);
  return { distance, location, duration };
}
