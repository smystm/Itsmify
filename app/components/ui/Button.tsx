"use client"

import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react"
import { motion, useReducedMotion } from "motion/react"

type ButtonType = "button" | "submit" | "reset"
type ButtonVariant = "primary" | "toggle"

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick"> {
   children: ReactNode
   type?: ButtonType
   variant?: ButtonVariant
   isActive?: boolean
   /**
    * Primary buttons default to `w-full`. Pass `fullWidth={false}` for an
    * auto-width button — do NOT try `className="w-auto"`, because Tailwind emits
    * `.w-auto` before `.w-full`, so the two same-specificity rules collide and
    * `w-full` always wins.
    */
   fullWidth?: boolean
   /** Shared id for the sliding pill — must be identical across sibling toggles. */
   layoutId?: string
   onClick?: MouseEventHandler<HTMLButtonElement>
   disabled?: boolean
   className?: string
}

const baseButtonClass =
   "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full text-sm font-bold transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"

const primaryButtonClass =
   "bg-linear-to-l from-brand-700 to-brand-800 px-6 py-3 text-white shadow-lg shadow-brand-700/25 hover:brightness-110 hover:shadow-xl hover:shadow-brand-700/40"

const toggleActiveButtonClass =
   "bg-linear-to-l from-brand-700 to-brand-800 px-2 py-2 text-white shadow-md shadow-brand-700/25"

const toggleInactiveButtonClass =
   "px-2 py-2 text-navy-600 transition-colors hover:text-brand-700 dark:text-navy-300 dark:hover:text-brand-200"

export default function Button({
   children,
   type = "button",
   variant = "primary",
   isActive = false,
   fullWidth,
   layoutId,
   onClick,
   disabled = false,
   className = "",
   ...rest
}: ButtonProps) {
   const prefersReduced = useReducedMotion()
   const isToggle = variant === "toggle"

   // When a sliding pill is available it carries the background, so the button
   // itself must stay transparent or the gradient would double up.
   const usePill = isToggle && isActive && Boolean(layoutId)

   const variantClass = isToggle
      ? isActive
         ? usePill
            ? "text-white"
            : toggleActiveButtonClass
         : toggleInactiveButtonClass
      : primaryButtonClass

   const widthClass = (fullWidth ?? !isToggle) ? "w-full" : ""

   return (
      <button
         type={type}
         onClick={onClick}
         disabled={disabled}
         className={`${baseButtonClass} ${variantClass} ${widthClass} ${className}`.trim().replace(/\s+/g, " ")}
         {...rest}
      >
         {usePill ? (
            <motion.span
               aria-hidden="true"
               layoutId={layoutId}
               className="pointer-events-none absolute inset-0 z-0 rounded-full bg-linear-to-l from-brand-700 to-brand-800 shadow-md shadow-brand-700/25"
               transition={prefersReduced ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }}
            />
         ) : null}

         {/* Shine sweep. z-0 keeps it behind the label — an overlay above the text
             would wash white label text out against the brand gradient. */}
         {variant === "primary" ? (
            /* via-white/8 keeps the sweep below the 4.5:1 threshold even at its peak,
             so it can never reduce the label's contrast mid-animation. */
            <span
               aria-hidden="true"
               className="pointer-events-none absolute inset-0 z-0 -translate-x-full bg-linear-to-l from-transparent via-white/8 to-transparent transition-transform duration-700 group-hover:translate-x-full rtl:translate-x-full rtl:group-hover:-translate-x-full"
            />
         ) : null}

         <span className="relative z-10">{children}</span>
      </button>
   )
}
