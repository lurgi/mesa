export class ValueUpdater {
  static updateLastValue<R>(
    newValue: R,
    isIdentitySelector: boolean,
    lastValueRef: React.MutableRefObject<R | undefined>
  ): void {
    if (Array.isArray(newValue)) {
      lastValueRef.current = [...newValue] as R;
    } else if (
      typeof newValue === "object" &&
      newValue !== null &&
      isIdentitySelector
    ) {
      lastValueRef.current = { ...newValue } as R;
    } else {
      lastValueRef.current = newValue;
    }
  }
}