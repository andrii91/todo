import { onUnmounted, ref, watch } from "vue";
import type { TodoItem } from "../types/todo";

const STORAGE_KEY = "todo-list-v1";
const MAX_URL_LENGTH = 2000;
const SAVE_DEBOUNCE_MS = 300;

export type ShareResult = "shared" | "copied" | "too_long" | "error";
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
  writer.write(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer);
  writer.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
};

const decompress = async (input: Uint8Array): Promise<Uint8Array> => {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer);
  writer.close();
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
    // localStorage недоступний (Safari Private) або перевищено квоту — ігноруємо
  }
};

export const useTodos = () => {
  const todos = ref<TodoItem[]>([]);
  /** Список, отриманий із посилання, що очікує рішення користувача (замінити/додати). */
  const pendingImport = ref<TodoItem[] | null>(null);

  const init = async (): Promise<void> => {
    const params = new URLSearchParams(window.location.search);
    const urlData = params.get("data");
    const stored = loadFromStorage();

    if (urlData) {
      const decoded = await decodeTodos(urlData);
      window.history.replaceState({}, "", window.location.pathname);

      if (decoded && decoded.length > 0) {
        // Якщо локальний список порожній — імпортуємо одразу,
        // інакше питаємо користувача, щоб не затерти його дані.
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

  // Дебаунсимо запис, щоб не смикати localStorage на кожне натискання клавіші.
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

  // Синхронізація між вкладками: реагуємо на зміни в інших вкладках.
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
      // падаємо у legacy-фолбек нижче
    }

    // Фолбек для небезпечного контексту (http) або старих браузерів.
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

    // На мобільних — нативний шер; на десктопі зазвичай немає navigator.share.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Мій список завдань", url: urlString });
        return "shared";
      } catch (e) {
        // Користувач скасував системний діалог — не вважаємо це помилкою копіювання.
        if (e instanceof DOMException && e.name === "AbortError") {
          return "error";
        }
        // Інакше пробуємо буфер обміну як запасний варіант.
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
