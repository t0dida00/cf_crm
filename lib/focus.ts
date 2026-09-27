/**
 * Focuses the first field marked invalid inside `root`, after React has
 * rendered the errors, so a failed submit takes keyboard and screen-reader
 * users straight to what needs fixing (WCAG 3.3.1).
 */
export function focusFirstInvalid(root: ParentNode | null | undefined) {
  requestAnimationFrame(() => {
    root?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  });
}
