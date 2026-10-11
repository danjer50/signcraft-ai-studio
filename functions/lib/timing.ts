/** Constant-time comparison of two hex strings (security-review amendment). */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  let difference = 0;
  for (let index = 0; index < bytesA.length; index += 1) {
    difference |= (bytesA[index] ?? 0) ^ (bytesB[index] ?? 0);
  }
  return difference === 0;
}
