import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 btn-press focus:outline-none focus:ring-2 focus:ring-sky focus:ring-offset-2'

    const variants = {
      primary: 'bg-gradient-to-r from-sky to-sky-dark text-white hover:shadow-lg hover:shadow-sky/30',
      secondary: 'bg-white text-text-primary border border-border hover:bg-sky-light hover:border-sky',
      outline: 'border-2 border-sky text-sky hover:bg-sky hover:text-white',
      ghost: 'text-text-secondary hover:text-sky hover:bg-sky-light',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-5 py-2.5 text-base',
      lg: 'px-7 py-3.5 text-lg',
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
