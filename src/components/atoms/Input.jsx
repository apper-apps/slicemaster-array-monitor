import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Input = forwardRef(({ 
  className,
  type = 'text',
  error,
  ...props
}, ref) => {
  const baseStyles = "block w-full px-3 py-2 border rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
  
  const variants = {
    default: "border-gray-300 focus:border-primary focus:ring-primary/20 bg-white",
    error: "border-error focus:border-error focus:ring-error/20 bg-red-50"
  }
  
  const variant = error ? 'error' : 'default'
  
  return (
    <input
      type={type}
      className={cn(baseStyles, variants[variant], className)}
      ref={ref}
      {...props}
    />
  )
})

Input.displayName = "Input"

export default Input