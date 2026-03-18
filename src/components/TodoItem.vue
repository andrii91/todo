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

function startEdit(): void {
  editText.value = todo.text;
  isEditing.value = true;
  nextTick(() => editInput.value?.focus());
}

function saveEdit(): void {
  const trimmed = editText.value.trim();
  if (trimmed && trimmed !== todo.text) {
    emit("update", todo.id, trimmed);
  }
  isEditing.value = false;
}

function cancelEdit(): void {
  isEditing.value = false;
}
</script>

<template>
  <li class="todo-item" :class="{ completed: todo.completed }">
    <div v-if="!isEditing" class="todo-view">
      <label class="todo-checkbox">
        <input
          type="checkbox"
          :checked="todo.completed"
          @change="emit('toggle', todo.id)"
        />
        <span class="checkmark" />
      </label>

      <span class="todo-text" @dblclick="startEdit">{{ todo.text }}</span>

      <div class="todo-actions">
        <button
          class="btn-icon btn-edit"
          title="Редагувати"
          @click="startEdit"
        >
          ✎
        </button>
        <button
          class="btn-icon btn-delete"
          title="Видалити"
          @click="emit('remove', todo.id)"
        >
          ✕
        </button>
      </div>
    </div>

    <div v-else class="todo-edit">
      <input
        ref="editInput"
        v-model="editText"
        class="edit-input"
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

.todo-item.completed .todo-text {
  text-decoration: line-through;
  opacity: 0.5;
}

.todo-view {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 14px 16px;
  gap: 12px;
}

.todo-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  cursor: pointer;
}

.todo-checkbox input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid var(--color-border);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.checkmark::after {
  content: "";
  display: none;
  width: 5px;
  height: 10px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin-bottom: 2px;
}

.todo-checkbox input:checked + .checkmark {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.todo-checkbox input:checked + .checkmark::after {
  display: block;
}

.todo-text {
  flex: 1;
  font-size: 15px;
  line-height: 1.4;
  color: var(--color-text);
  cursor: default;
  word-break: break-word;
}

.todo-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.todo-item:hover .todo-actions {
  opacity: 1;
}

.btn-icon {
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

.btn-edit:hover {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.btn-delete:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.todo-edit {
  width: 100%;
  padding: 6px 8px;
}

.edit-input {
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
