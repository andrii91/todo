import { onUnmounted, ref, watch } from "vue";
import type { TodoItem } from "@/types/todo";
import { t } from "@/i18n";

const STORAGE_KEY = "todo-list-v1";
const MAX_URL_LENGTH = 2000;
const SAVE_DEBOUNCE_MS = 300;

export type ShareResult =
  | "shared"
  | "copied"
  | "too_long"
  | "error"
  | "canceled";
export type ImportMode = "replace" | "merge";

const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const isTodoItem = (value: unknown): value is TodoItem =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as TodoItem).id === "string" &&
  typeof (value as TodoItem).text === "string" &&
  typeof (value as TodoItem).completed === "boolean";

const compress = async (input: Uint8Array): Promise<Uint8Array> => {
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  void writer.write(input as BufferSource);
  void writer.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
};

const decompress = async (input: Uint8Array): Promise<Uint8Array> => {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  void writer.write(input as BufferSource);
  void writer.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
};

const encodeTodos = async (todos: TodoItem[]): Promise<string> => {
  const compact = todos.map((t) => [t.text, t.completed ? 1 : 0]);
  const bytes = new TextEncoder().encode(JSON.stringify(compact));
  const compressed = await compress(bytes);
  let binary = "";
  for (let i = 0; i < compressed.length; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

const decodeTodos = async (encoded: string): Promise<TodoItem[] | null> => {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const compressed = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const bytes = await decompress(compressed);
    const json = new TextDecoder().decode(bytes);
    const compact: unknown = JSON.parse(json);
    if (!Array.isArray(compact)) return null;
    return compact
      .filter(
        (entry): entry is [string, number] =>
          Array.isArray(entry) && typeof entry[0] === "string",
      )
      .map(([text, done]) => ({
        id: generateId(),
        text,
        completed: done === 1,
      }));
  } catch {
    return null;
  }
};

const loadFromStorage = (): TodoItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTodoItem);
  } catch {
    return [];
  }
};

const saveToStorage = (todos: TodoItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // localStorage unavailable (Safari Private) or quota exceeded — ignore
  }
};

export const useTodos = () => {
  const todos = ref<TodoItem[]>([]);
  /** List received from a link, awaiting the user's decision (replace/merge). */
  const pendingImport = ref<TodoItem[] | null>(null);

  const init = async (): Promise<void> => {
    const params = new URLSearchParams(window.location.search);
    const urlData = params.get("data");
    const stored = loadFromStorage();

    if (urlData) {
      const decoded = await decodeTodos(urlData);
      window.history.replaceState({}, "", window.location.pathname);

      if (decoded && decoded.length > 0) {
        // If the local list is empty — import right away,
        // otherwise ask the user so we don't overwrite their data.
        if (stored.length === 0) {
          todos.value = decoded;
          return;
        }
        pendingImport.value = decoded;
      }
    }

    todos.value = stored;
  };

  const applyImport = (mode: ImportMode): void => {
    const incoming = pendingImport.value;
    if (!incoming) return;

    if (mode === "replace") {
      todos.value = incoming;
    } else {
      const existingTexts = new Set(todos.value.map((t) => t.text));
      const fresh = incoming.filter((t) => !existingTexts.has(t.text));
      todos.value = [...todos.value, ...fresh];
    }
    pendingImport.value = null;
  };

  const dismissImport = (): void => {
    pendingImport.value = null;
  };

  // Debounce writes so we don't hit localStorage on every keystroke.
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  watch(
    todos,
    (val) => {
      clearTimeout(saveTimer);
      const snapshot = val.map((t) => ({ ...t }));
      saveTimer = setTimeout(() => saveToStorage(snapshot), SAVE_DEBOUNCE_MS);
    },
    { deep: true },
  );

  // Cross-tab sync: react to changes made in other tabs.
  const onStorage = (e: StorageEvent): void => {
    if (e.key === STORAGE_KEY) {
      todos.value = loadFromStorage();
    }
  };
  window.addEventListener("storage", onStorage);

  onUnmounted(() => {
    clearTimeout(saveTimer);
    window.removeEventListener("storage", onStorage);
  });

  const addTodo = (text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) return;

    todos.value.push({
      id: generateId(),
      text: trimmed,
      completed: false,
    });
  };

  const removeTodo = (id: string): void => {
    todos.value = todos.value.filter((t) => t.id !== id);
  };

  const toggleTodo = (id: string): void => {
    const todo = todos.value.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  };

  const updateTodo = (id: string, text: string): void => {
    const todo = todos.value.find((t) => t.id === id);
    if (todo) {
      todo.text = text.trim();
    }
  };

  const clearAll = (): void => {
    todos.value = [];
  };

  const buildShareUrl = (encoded: string): string => {
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("data", encoded);
    return url.toString();
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall through to the legacy fallback below
    }

    // Fallback for an insecure context (http) or older browsers.
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      return false;
    }
  };

  const share = async (): Promise<ShareResult> => {
    const encoded = await encodeTodos(todos.value);
    const urlString = buildShareUrl(encoded);

    if (urlString.length > MAX_URL_LENGTH) {
      return "too_long";
    }

    // On mobile — native share; desktop usually has no navigator.share.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("share.title"), url: urlString });
        return "shared";
      } catch (e) {
        // User canceled the system dialog — don't treat it as an error.
        if (e instanceof DOMException && e.name === "AbortError") {
          return "canceled";
        }
        // Otherwise try the clipboard as a fallback.
      }
    }

    return (await copyToClipboard(urlString)) ? "copied" : "error";
  };

  init();

  return {
    todos,
    pendingImport,
    addTodo,
    removeTodo,
    toggleTodo,
    updateTodo,
    clearAll,
    share,
    applyImport,
    dismissImport,
  };
};
