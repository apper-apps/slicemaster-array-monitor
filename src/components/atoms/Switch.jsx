import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Switch = forwardRef(({ 
  className,
  checked,
  onChange,
  disabled,
  ...props
}, ref) => {
  const baseStyles = "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
  
  const bgColor = checked ? 'bg-primary' : 'bg-gray-200'
  const translateX = checked ? 'translate-x-6' : 'translate-x-1'
  
  return (
    <button
      type="button"
      className={cn(baseStyles, bgColor, className)}
      onClick={() => onChange?.(!checked)}
      disabled={disabled}
      ref={ref}
      {...props}
    >
      <span className={cn(
        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200",
        translateX
      )} />
    </button>
  )
})

Switch.displayName = "Switch"

export default Switch