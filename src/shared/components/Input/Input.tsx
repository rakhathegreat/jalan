import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import type { VariantProps } from 'class-variance-authority';

import { cn } from '@shared/lib/cn';

import { inputVariants } from './variants';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> &
  VariantProps<typeof inputVariants> & {
    label?: string;
    helperText?: string;
    error?: string;
    onValueChange?: (value: string) => void;
    clearOnEscape?: boolean;
    showEscapeHint?: boolean;
  };

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      helperText,
      error,
      className,
      variant,
      size,
      type = 'text',
      value,
      defaultValue,
      onValueChange,
      clearOnEscape = true,
      showEscapeHint = true,
      onKeyDown,
      onChange,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLInputElement>(null);
    useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<string>(() => {
      if (defaultValue === undefined) return '';
      if (typeof defaultValue === 'string') return defaultValue;
      if (Array.isArray(defaultValue)) return defaultValue.join(', ');
      return String(defaultValue);
    });

    useEffect(() => {
      if (isControlled) {
        if (Array.isArray(value)) setInternalValue(value.join(', '));
        else setInternalValue(value ? String(value) : '');
      }
    }, [isControlled, value]);

    const currentValue = isControlled ? (value ?? '') : internalValue;
    const hasValue = `${currentValue ?? ''}`.length > 0;

    const applyValue = (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(event.target.value);
      onValueChange?.(event.target.value);
      onChange?.(event);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape' && clearOnEscape && hasValue) {
        event.preventDefault();
        event.stopPropagation();
        applyValue('');
        return;
      }

      onKeyDown?.(event);
    };

    const messageId = error || helperText ? `${id ?? props.name ?? 'input'}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="mb-2 block text-sm font-normal text-gray-700">
            {label}
          </label>
        )}

        <div className='relative'>
          <input
            id={id}
            ref={(node) => {
              innerRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            type={type}
            value={currentValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            aria-invalid={Boolean(error)}
            aria-describedby={messageId}
            className={cn(
              inputVariants({ variant, size }),
              showEscapeHint && hasValue ,
              error && 'border-red-400 focus-visible:ring-red-200',
              className
            )}
            {...props}
          />

          {showEscapeHint && hasValue &&  (
            <span className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-gray-300 bg-white px-2 py-1 text-[10px] font-normal uppercase text-gray-500 sm:inline-flex">
              esc
            </span>
          )}
        </div>

        {error ? (
          <p id={messageId} className="mt-2 text-sm text-red-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={messageId} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
