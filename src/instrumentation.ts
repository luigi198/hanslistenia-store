// Runs once per server instance before it accepts requests. NEXT_RUNTIME is
// inlined at build time, so the Edge bundle drops the Node-only import.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNode } = await import("./instrumentation-node");
    registerNode();
  }
}
