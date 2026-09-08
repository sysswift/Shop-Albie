/** Log server-side detail; return a safe message to clients. */
export function throwServerError(
  context: string,
  cause: unknown,
  userMessage = "Request failed. Please try again.",
): never {
  const detail = cause instanceof Error ? cause.message : String(cause);
  console.error(`[${context}]`, detail);
  throw new Error(userMessage);
}
