import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { describedBy } from './describedBy';

/**
 * Поля ввода. Шрифт 16px — меньше нельзя: iPhone начнёт приближать страницу.
 * Ошибка подсвечивается красной рамкой через aria-invalid.
 */
const FIELD_CLASS = cx(
  'w-full rounded-md border border-gray-700 bg-night/70 text-base text-text',
  'placeholder:text-muted transition-colors duration-(--wa-motion-fast)',
  'focus:border-number focus:outline-none aria-invalid:border-danger',
);

export function TextInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input type="text" className={cx(FIELD_CLASS, 'h-12 px-3', className)} {...rest} />;
}

export function DateInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  // Без моноширинного шрифта: в половину строки дата «01.10.2026» с иконкой иначе не влезает.
  return <input type="date" className={cx(FIELD_CLASS, 'h-12 px-2.5', className)} {...rest} />;
}

interface NumberInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  /** null — поле пустое. */
  value: number | null;
  onChange: (value: number | null) => void;
}

/** Число. Пустое поле → null, чтобы можно было стереть и ввести заново. */
export function NumberInput({ value, onChange, className, ...rest }: NumberInputProps) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      className={cx(FIELD_CLASS, 'numeric h-12 px-3', className)}
      {...rest}
    />
  );
}

export function TextArea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cx(FIELD_CLASS, 'min-h-28 resize-y px-3 py-3', className)} {...rest} />
  );
}

interface FieldProps {
  /** id поля ввода внутри — для связи с подписью. */
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Подпись + поле + подсказка или ошибка.
 * Полю внутри дай id и aria-describedby={describedBy(id)} — тогда скринридер
 * прочитает подсказку или ошибку вместе с подписью.
 */
export function Field({ id, label, hint, error, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm text-text">
        {label}
      </label>
      {children}
      {error ? (
        <p id={describedBy(id)} className="mt-1.5 text-sm text-danger-text">
          {error}
        </p>
      ) : (
        hint && (
          <p id={describedBy(id)} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
