import { ref, watch } from "vue";
import type { TodoItem } from "../types/todo";

const STORAGE_KEY = "todo-list";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function encodeTodos(todos: TodoItem[]): string {
  return btoa(encodeURIComponent(JSON.stringify(todos)));
}

function decodeTodos(encoded: string): TodoItem[] | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
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

  function init(): void {
    const params = new URLSearchParams(window.location.search);
    const urlData = params.get("data");

    if (urlData) {
      const decoded = decodeTodos(urlData);
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

  function getShareUrl(): string {
    const encoded = encodeTodos(todos.value);
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("data", encoded);
    return url.toString();
  }

  async function share(): Promise<boolean> {
    const url = getShareUrl();

    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
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
