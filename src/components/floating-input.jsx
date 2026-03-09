import * as React from "react"
import { cn } from "@/lib/utils"

const FloatingInput = React.forwardRef(
  ({ className, label, icon, error, type, id, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(false)

    const inputId = id || `floating-${label.toLowerCase().replace(/\s/g, '-')}`

    const handleFocus = (e) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e) => {
      setIsFocused(false)
      setHasValue(e.target.value !== '')
      props.onBlur?.(e)
    }

    const handleChange = (e) => {
      setHasValue(e.target.value !== '')
      props.onChange?.(e)
    }

    const isFloating = isFocused || hasValue || props.value || props.placeholder

    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10 transition-colors">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "peer w-full h-12 px-3 pt-5 pb-1 text-base rounded-md border border-gray-200 bg-white",
            "transition-all duration-200 outline-none",
            "focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-300 focus:border-red-500 focus:ring-red-500/10",
            icon && "pl-10",
            className
          )}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        <label
          htmlFor={inputId}
          className={cn(
            "absolute left-3 text-gray-500 pointer-events-none transition-all duration-200",
            icon && "left-10",
            isFloating
              ? "top-1.5 text-xs font-medium"
              : "top-1/2 -translate-y-1/2 text-base",
            isFocused && "text-gray-900",
            error && "text-red-500"
          )}
        >
          {label}
        </label>
      </div>
    )
  }
)

FloatingInput.displayName = "FloatingInput"

export { FloatingInput }
