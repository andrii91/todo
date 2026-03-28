import { ref, watch } from "vue";
import type { TodoItem } from "../types/todo";

const STORAGE_KEY = "todo-list";
const MAX_URL_LENGTH = 2000;

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

async function compress(input: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream("deflate-raw");
  const writer = cs.writable.getWriter();
  writer.write(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer);
  writer.close();
  return new Uint8Array(await new Response(cs.readable).arrayBuffer());
}

async function decompress(input: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream("deflate-raw");
  const writer = ds.writable.getWriter();
  writer.write(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer);
  writer.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

async function encodeTodos(todos: TodoItem[]): Promise<string> {
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
}

async function decodeTodos(encoded: string): Promise<TodoItem[] | null> {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64);
    const compressed = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const bytes = await decompress(compressed);
    const json = new TextDecoder().decode(bytes);
    const compact: [string, number][] = JSON.parse(json);
    if (!Array.isArray(compact)) return null;
    return compact.map(([text, done]) => ({
      id: generateId(),
      text,
      completed: done === 1,
    }));
  } catch {
    return null;
  }
}

function loadFromStorage(): TodoItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(todos: TodoItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function useTodos() {
  const todos = ref<TodoItem[]>([]);

  async function init(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const urlData = params.get("data");

    if (urlData) {
      const decoded = await decodeTodos(urlData);
      if (decoded) {
        todos.value = decoded;
        saveToStorage(decoded);
        window.history.replaceState({}, "", window.location.pathname);
        return;
      }
    }

    todos.value = loadFromStorage();
  }

  watch(todos, (val) => saveToStorage(val), { deep: true });

  function addTodo(text: string): void {
    const trimmed = text.trim();
    if (!trimmed) return;

    todos.value.push({
      id: generateId(),
      text: trimmed,
      completed: false,
    });
  }

  function removeTodo(id: string): void {
    todos.value = todos.value.filter((t) => t.id !== id);
  }

  function toggleTodo(id: string): void {
    const todo = todos.value.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
    }
  }

  function updateTodo(id: string, text: string): void {
    const todo = todos.value.find((t) => t.id === id);
    if (todo) {
      todo.text = text.trim();
    }
  }

  function clearAll(): void {
    todos.value = [];
  }

  async function share(): Promise<"ok" | "too_long" | "error"> {
    const encoded = await encodeTodos(todos.value);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("data", encoded);
    const urlString = url.toString();

    if (urlString.length > MAX_URL_LENGTH) {
      return "too_long";
    }

    try {
      await navigator.clipboard.writeText(urlString);
      return "ok";
    } catch {
      return "error";
    }
  }

  init();

  return {
    todos,
    addTodo,
    removeTodo,
    toggleTodo,
    updateTodo,
    clearAll,
    share,
  };
}
