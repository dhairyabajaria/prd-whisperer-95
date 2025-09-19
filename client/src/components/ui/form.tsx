import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"
import { InfoIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = "FormMessage"

// Enhanced validation hint components
type FormHintProps = {
  children: React.ReactNode
  type?: 'info' | 'success' | 'warning' | 'error'
  className?: string
  icon?: boolean
  show?: boolean
}

const FormHint = React.forwardRef<
  HTMLDivElement,
  FormHintProps
>(({ children, type = 'info', className, icon = true, show = true, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  if (!show) return null

  const iconMap = {
    info: InfoIcon,
    success: CheckCircle2Icon,
    warning: AlertCircleIcon,
    error: AlertCircleIcon,
  }

  const IconComponent = iconMap[type]

  const colorClasses = {
    info: "text-muted-foreground bg-muted/50 border-muted",
    success: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800",
    warning: "text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800",
    error: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800",
  }

  return (
    <div
      ref={ref}
      id={`${formDescriptionId}-hint`}
      className={cn(
        "flex items-start gap-2 p-3 rounded-md border text-sm",
        colorClasses[type],
        className
      )}
      data-testid={`form-hint-${type}`}
      {...props}
    >
      {icon && <IconComponent className="h-4 w-4 mt-0.5 flex-shrink-0" />}
      <div className="flex-1">{children}</div>
    </div>
  )
})
FormHint.displayName = "FormHint"

// Validation requirements component
type FormRequirementsProps = {
  requirements: Array<{
    text: string
    satisfied: boolean
    key: string
  }>
  className?: string
}

const FormRequirements = React.forwardRef<
  HTMLDivElement,
  FormRequirementsProps
>(({ requirements, className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <div
      ref={ref}
      id={`${formDescriptionId}-requirements`}
      className={cn("space-y-1", className)}
      data-testid="form-requirements"
      {...props}
    >
      {requirements.map((req) => (
        <div
          key={req.key}
          className={cn(
            "flex items-center gap-2 text-sm",
            req.satisfied
              ? "text-green-600 dark:text-green-400"
              : "text-muted-foreground"
          )}
        >
          <CheckCircle2Icon
            className={cn(
              "h-3 w-3",
              req.satisfied ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          />
          <span className={req.satisfied ? "line-through" : ""}>{req.text}</span>
        </div>
      ))}
    </div>
  )
})
FormRequirements.displayName = "FormRequirements"

// Interactive validation hint that shows on focus
type FormValidationHintProps = {
  children: React.ReactNode
  className?: string
  showOnFocus?: boolean
  showOnError?: boolean
  showOnSuccess?: boolean
}

const FormValidationHint = React.forwardRef<
  HTMLDivElement,
  FormValidationHintProps
>(({ children, className, showOnFocus = true, showOnError = true, showOnSuccess = false, ...props }, ref) => {
  const { error, isDirty, invalid } = useFormField()
  const [isFocused, setIsFocused] = React.useState(false)

  // Determine when to show the hint
  const shouldShow = React.useMemo(() => {
    if (error && showOnError) return true
    if (isDirty && !invalid && showOnSuccess) return true
    if (isFocused && showOnFocus) return true
    return false
  }, [error, isDirty, invalid, isFocused, showOnError, showOnSuccess, showOnFocus])

  // Listen for focus events on the form field
  React.useEffect(() => {
    const handleFocus = () => setIsFocused(true)
    const handleBlur = () => setIsFocused(false)

    // Find the form control element
    const formItem = document.querySelector(`[data-form-item]`)
    const input = formItem?.querySelector('input, textarea, select')

    if (input) {
      input.addEventListener('focus', handleFocus)
      input.addEventListener('blur', handleBlur)

      return () => {
        input.removeEventListener('focus', handleFocus)
        input.removeEventListener('blur', handleBlur)
      }
    }
  }, [])

  if (!shouldShow) return null

  const hintType = error ? 'error' : (isDirty && !invalid) ? 'success' : 'info'

  return (
    <FormHint
      ref={ref}
      type={hintType}
      className={className}
      data-testid="form-validation-hint"
      {...props}
    >
      {children}
    </FormHint>
  )
})
FormValidationHint.displayName = "FormValidationHint"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormHint,
  FormRequirements,
  FormValidationHint,
}
