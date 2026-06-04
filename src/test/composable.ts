import { createApp, type App } from "vue";

/**
 * Runs a composable inside a throwaway component so lifecycle hooks
 * (`onUnmounted`) and effects (`watch`) have a proper owner instance.
 * Remember to call `app.unmount()` to trigger cleanup.
 */
export function withSetup<T>(composable: () => T): { result: T; app: App } {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => null;
    },
  });
  app.mount(document.createElement("div"));
  return { result, app };
}
