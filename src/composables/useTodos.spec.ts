import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useTodos } from "@/composables/useTodos";
import type { TodoItem } from "@/types/todo";
import { withSetup } from "@/test/composable";

const STORAGE_KEY = "todo-list-v1";

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTodos — basic operations", () => {
  it("adds a trimmed todo", () => {
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("  Buy milk  ");

    expect(result.todos.value).toHaveLength(1);
    expect(result.todos.value[0]).toMatchObject({
      text: "Buy milk",
      completed: false,
    });
    app.unmount();
  });

  it("ignores empty or whitespace-only input", () => {
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("   ");
    result.addTodo("");

    expect(result.todos.value).toHaveLength(0);
    app.unmount();
  });

  it("toggles completion", () => {
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("Task");
    const id = result.todos.value[0].id;

    result.toggleTodo(id);
    expect(result.todos.value[0].completed).toBe(true);
    result.toggleTodo(id);
    expect(result.todos.value[0].completed).toBe(false);
    app.unmount();
  });

  it("removes a todo by id", () => {
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("A");
    result.addTodo("B");
    const idA = result.todos.value[0].id;

    result.removeTodo(idA);
    expect(result.todos.value).toHaveLength(1);
    expect(result.todos.value[0].text).toBe("B");
    app.unmount();
  });

  it("updates a todo's text (trimmed)", () => {
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("Old");
    const id = result.todos.value[0].id;

    result.updateTodo(id, "  New text  ");
    expect(result.todos.value[0].text).toBe("New text");
    app.unmount();
  });

  it("clears all todos", () => {
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("A");
    result.addTodo("B");

    result.clearAll();
    expect(result.todos.value).toHaveLength(0);
    app.unmount();
  });
});

describe("useTodos — import flow", () => {
  const incoming: TodoItem[] = [
    { id: "x", text: "Shared 1", completed: false },
    { id: "y", text: "Shared 2", completed: true },
  ];

  it("replaces the list on replace import", () => {
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("Local");
    result.pendingImport.value = [...incoming];

    result.applyImport("replace");
    expect(result.todos.value.map((t) => t.text)).toEqual([
      "Shared 1",
      "Shared 2",
    ]);
    expect(result.pendingImport.value).toBeNull();
    app.unmount();
  });

  it("merges without duplicating existing texts", () => {
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("Shared 1");
    result.pendingImport.value = [...incoming];

    result.applyImport("merge");
    expect(result.todos.value.map((t) => t.text)).toEqual([
      "Shared 1",
      "Shared 2",
    ]);
    app.unmount();
  });

  it("dismisses a pending import", () => {
    const { result, app } = withSetup(() => useTodos());
    result.pendingImport.value = [...incoming];

    result.dismissImport();
    expect(result.pendingImport.value).toBeNull();
    app.unmount();
  });
});

describe("useTodos — persistence", () => {
  it("loads existing todos from localStorage on init", () => {
    const seed: TodoItem[] = [{ id: "1", text: "Seeded", completed: true }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));

    const { result, app } = withSetup(() => useTodos());
    expect(result.todos.value).toEqual(seed);
    app.unmount();
  });

  it("persists changes to localStorage (debounced)", async () => {
    vi.useFakeTimers();
    const { result, app } = withSetup(() => useTodos());
    result.addTodo("Persist me");

    // Debounced — nothing written yet.
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();

    await vi.advanceTimersByTimeAsync(300);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe("Persist me");
    app.unmount();
  });

  it("ignores corrupt localStorage data", () => {
    localStorage.setItem(STORAGE_KEY, "not json");
    const { result, app } = withSetup(() => useTodos());
    expect(result.todos.value).toEqual([]);
    app.unmount();
  });
});

describe("useTodos — share round-trip", () => {
  it("encodes the list into a URL that decodes back on a fresh load", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("isSecureContext", true);

    const { result, app } = withSetup(() => useTodos());
    result.addTodo("Round trip");
    result.toggleTodo(result.todos.value[0].id);

    const outcome = await result.share();
    expect(outcome).toBe("copied");
    app.unmount();

    const sharedUrl = writeText.mock.calls[0][0] as string;
    const data = new URL(sharedUrl).searchParams.get("data");
    expect(data).toBeTruthy();

    // Fresh load with the shared link and no local data → direct import.
    localStorage.clear();
    window.history.replaceState({}, "", `/?data=${data}`);

    const { result: loaded, app: app2 } = withSetup(() => useTodos());
    await vi.waitFor(() => expect(loaded.todos.value).toHaveLength(1));

    expect(loaded.todos.value[0]).toMatchObject({
      text: "Round trip",
      completed: true,
    });
    app2.unmount();
  });
});
