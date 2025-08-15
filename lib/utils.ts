import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hexToPastel(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  // Mix with white to create pastel (70% white, 30% original color)
  const pastelR = Math.round(r * 0.3 + 255 * 0.7)
  const pastelG = Math.round(g * 0.3 + 255 * 0.7)
  const pastelB = Math.round(b * 0.3 + 255 * 0.7)
  
  // Convert back to hex
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  
  return `#${toHex(pastelR)}${toHex(pastelG)}${toHex(pastelB)}`
}