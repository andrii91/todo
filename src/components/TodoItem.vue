<script setup lang="ts">
import { ref, nextTick } from "vue";
import type { TodoItem } from "../types/todo";

type TodoItemProps = {
  todo: TodoItem;
};

defineOptions({
  name: "TodoItem",
});

const emit = defineEmits<{
  toggle: [id: string];
  remove: [id: string];
  update: [id: string, text: string];
}>();

const { todo } = defineProps<TodoItemProps>();

const isEditing = ref(false);
const editText = ref("");
const editInput = ref<HTMLInputElement | null>(null);

const startEdit = (): void => {
  editText.value = todo.text;
  isEditing.value = true;
  nextTick(() => editInput.value?.focus());
};

const saveEdit = (): void => {
  const trimmed = editText.value.trim();
  if (trimmed && trimmed !== todo.text) {
    emit("update", todo.id, trimmed);
  }
  isEditing.value = false;
};

const cancelEdit = (): void => {
  isEditing.value = false;
};
</script>

<template>
  <li class="todo-item" :class="{ 'todo-item--completed': todo.completed }">
    <div v-if="!isEditing" class="todo-item__view">
      <label class="todo-item__checkbox">
        <input
          type="checkbox"
          :checked="todo.completed"
          @change="emit('toggle', todo.id)"
        />
        <span class="todo-item__checkmark" />
      </label>

      <span class="todo-item__text" @dblclick="startEdit">{{ todo.text }}</span>

      <div class="todo-item__actions">
        <button
          class="todo-item__btn todo-item__btn--edit"
          title="Редагувати"
          @click="startEdit"
        >
          ✎
        </button>
        <button
          class="todo-item__btn todo-item__btn--delete"
          title="Видалити"
          @click="emit('remove', todo.id)"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-else class="todo-item__edit">
      <input
        ref="editInput"
        v-model="editText"
        class="todo-item__edit-input"
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
        @blur="saveEdit"
      />
    </div>
  </li>
</template>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 0;
  border-radius: 12px;
  background: var(--color-surface);
  transition: all 0.2s ease;
  overflow: hidden;
}

.todo-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.todo-item--completed .todo-item__text {
  text-decoration: line-through;
  opacity: 0.5;
}

.todo-item__view {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  gap: 12px;
}

.todo-item__checkbox {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  cursor: pointer;
}

.todo-item__checkbox input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.todo-item__checkmark {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid var(--color-border);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-item__checkmark::after {
  content: "";
  display: none;
  width: 5px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

.todo-item__checkbox input:checked + .todo-item__checkmark {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.todo-item__checkbox input:checked + .todo-item__checkmark::after {
  display: block;
}

.todo-item__text {
  flex: 1;
  font-size: 15px;
  line-height: 1.4;
  color: var(--color-text);
  cursor: default;
  word-break: break-word;
}

.todo-item__actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.todo-item:hover .todo-item__actions {
  opacity: 1;
}

.todo-item__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.15s ease;
  color: var(--color-text-muted);
}

.todo-item__btn--edit:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.todo-item__btn--delete:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.todo-item__edit {
  width: 100%;
  padding: 6px 8px;
}

.todo-item__edit-input {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid var(--color-primary);
  border-radius: 10px;
  font-size: 15px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
  font-family: inherit;
}
</style>
