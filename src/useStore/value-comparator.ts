export class ValueComparator {
  static shouldUpdateValue<R>(
    newValue: R,
    oldValue: R | undefined,
    isIdentitySelector: boolean
  ): boolean {
    if (Array.isArray(newValue) || isIdentitySelector) {
      return true;
    }

    if (!Object.is(oldValue, newValue)) {
      return true;
    }

    if (
      typeof newValue === "object" &&
      newValue !== null &&
      oldValue !== null
    ) {
      return this.hasObjectChanges(newValue, oldValue as any);
    }

    return false;
  }

  private static hasObjectChanges(newValue: any, oldValue: any): boolean {
    return (
      Object.keys(newValue).some(
        (key) => !Object.is(oldValue[key], newValue[key])
      ) ||
      Object.keys(oldValue).some(
        (key) => !Object.is(oldValue[key], newValue[key])
      )
    );
  }
}
