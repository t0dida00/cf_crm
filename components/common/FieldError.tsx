/** Props linking an input to its error message, for screen readers. */
export const fieldErrorProps = (id: string, error: string | undefined) =>
  error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

/** The error under a form field; renders nothing when there's no error. */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="text-xs text-destructive">
      {message}
    </p>
  );
}
