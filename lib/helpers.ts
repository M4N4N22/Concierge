// helpers.ts (new file)
export function hexZeroPad(value: string, length: number): string {
    const hex = value.startsWith("0x") ? value.slice(2) : value;
    return "0x" + hex.padStart(length * 2, "0");
  }
  