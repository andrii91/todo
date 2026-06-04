import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TodoItem from "@/components/TodoItem.vue";
import type { TodoItem as Todo } from "@/types/todo";
import { globalMountOptions } from "@/test/i18n";

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: "1",
  text: "Write tests",
  completed: false,
  ...overrides,
});

const mountItem = (todo: Todo = makeTodo()) =>
  mount(TodoItem, { props: { todo }, global: globalMountOptions });

describe("TodoItem", () => {
  it("renders the todo text", () => {
    const wrapper = mountItem();
    expect(wrapper.find('[data-testid="todo-text"]').text()).toBe("Write tests");
  });

  it("applies the completed modifier when completed", () => {
    const wrapper = mountItem(makeTodo({ completed: true }));
    expect(wrapper.find('[data-testid="todo-item"]').classes()).toContain(
      "todo-item--completed",
    );
  });

  it("emits toggle with the id when the checkbox changes", async () => {
    const wrapper = mountItem();
    await wrapper.find('[data-testid="todo-toggle"]').setValue(true);
    expect(wrapper.emitted("toggle")).toEqual([["1"]]);
  });

  it("emits remove with the id when delete is clicked", async () => {
    const wrapper = mountItem();
    await wrapper.find('[data-testid="todo-delete"]').trigger("click");
    expect(wrapper.emitted("remove")).toEqual([["1"]]);
  });

  it("enters edit mode on double click with the current text", async () => {
    const wrapper = mountItem();
    await wrapper.find('[data-testid="todo-text"]').trigger("dblclick");

    const input = wrapper.find<HTMLInputElement>(
      '[data-testid="todo-edit-input"]',
    );
    expect(input.exists()).toBe(true);
    expect(input.element.value).toBe("Write tests");
  });

  it("emits update with the new text on Enter", async () => {
    const wrapper = mountItem();
    await wrapper.find('[data-testid="todo-text"]').trigger("dblclick");
    const input = wrapper.find('[data-testid="todo-edit-input"]');
    await input.setValue("Updated text");
    await input.trigger("keyup.enter");

    expect(wrapper.emitted("update")).toEqual([["1", "Updated text"]]);
  });

  it("does not emit update when the text is unchanged", async () => {
    const wrapper = mountItem();
    await wrapper.find('[data-testid="todo-text"]').trigger("dblclick");
    const input = wrapper.find('[data-testid="todo-edit-input"]');
    await input.trigger("keyup.enter");

    expect(wrapper.emitted("update")).toBeUndefined();
  });

  it("cancels editing on Escape without emitting update", async () => {
    const wrapper = mountItem();
    await wrapper.find('[data-testid="todo-text"]').trigger("dblclick");
    const input = wrapper.find('[data-testid="todo-edit-input"]');
    await input.setValue("Discarded");
    await input.trigger("keyup.escape");

    expect(wrapper.emitted("update")).toBeUndefined();
    expect(wrapper.find('[data-testid="todo-edit-input"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="todo-text"]').exists()).toBe(true);
  });
});
