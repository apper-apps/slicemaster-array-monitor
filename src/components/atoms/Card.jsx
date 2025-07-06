import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Card = forwardRef(({ 
  className,
  variant = 'default',
  children,
  ...props
}, ref) => {
  const baseStyles = "bg-white border border-gray-200 rounded-xl shadow-md transition-all duration-200"
  
  const variants = {
    default: "hover:shadow-lg",
    elevated: "shadow-lg hover:shadow-xl",
    flat: "shadow-sm border-gray-100",
    gradient: "bg-gradient-to-br from-white to-gray-50 border-gray-100 shadow-lg hover:shadow-xl"
  }
  
  return (
    <div
      className={cn(baseStyles, variants[variant], className)}
      ref={ref}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = "Card"

export default Card