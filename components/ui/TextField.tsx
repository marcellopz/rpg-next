import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

const FIELD =
  "w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-accent-500 focus:outline-none disabled:opacity-50";

type FieldShellProps = {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
};

function FieldShell({ id, label, hint, error, children }: FieldShellProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

type SharedProps = {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string | null;
};

export interface TextFieldProps
  extends SharedProps,
    InputHTMLAttributes<HTMLInputElement> {}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, hint, error, id, className, ...props }, ref) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <FieldShell id={fieldId} label={label} hint={hint} error={error}>
        <input
          id={fieldId}
          ref={ref}
          className={cn(FIELD, error && "border-red-400", className)}
          {...props}
        />
      </FieldShell>
    );
  }
);

export interface TextAreaProps
  extends SharedProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ label, hint, error, id, className, rows = 3, ...props }, ref) {
    const generatedId = useId();
    const fieldId = id ?? generatedId;
    return (
      <FieldShell id={fieldId} label={label} hint={hint} error={error}>
        <textarea
          id={fieldId}
          ref={ref}
          rows={rows}
          className={cn(FIELD, "resize-none", error && "border-red-400", className)}
          {...props}
        />
      </FieldShell>
    );
  }
);
