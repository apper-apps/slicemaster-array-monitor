import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combines class names with conditional logic and proper Tailwind CSS merging
 * @param {...any} inputs - Class names, objects, arrays, or conditional expressions
 * @returns {string} - Merged class names string
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
export default cn