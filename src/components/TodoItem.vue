<script setup lang="ts">
import { ref, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import type { TodoItem } from "@/types/todo";

type TodoItemProps = {
  todo: TodoItem;
};

defineOptions({
  name: "TodoItem",
});

const { t } = useI18n();

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
  <li
    class="todo-item"
    :class="{ 'todo-item--completed': todo.completed }"
    data-testid="todo-item"
  >
    <div v-if="!isEditing" class="todo-item__view">
      <label class="todo-item__checkbox">
        <input
          type="checkbox"
          :checked="todo.completed"
          data-testid="todo-toggle"
          @change="emit('toggle', todo.id)"
        />
        <span class="todo-item__checkmark" />
      </label>

      <span
        class="todo-item__text"
        data-testid="todo-text"
        @dblclick="startEdit"
        >{{ todo.text }}</span
      >

      <div class="todo-item__actions">
        <button
          class="todo-item__btn todo-item__btn--edit"
          :title="t('todoItem.edit')"
          data-testid="todo-edit"
          @click="startEdit"
        >
          ✎
        </button>
        <button
          class="todo-item__btn todo-item__btn--delete"
          :title="t('todoItem.delete')"
          data-testid="todo-delete"
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
        data-testid="todo-edit-input"
        @keyup.enter="saveEdit"
        @keyup.escape="cancelEdit"
        @blur="saveEdit"
      />
    </div>
  </li>
</template>

<style scoped lang="scss">
.todo-item {
  display: flex;
  align-items: center;
  padding: 0;
  border-radius: 12px;
  background: var(--color-surface);
  transition: all 0.2s ease;
  overflow: hidden;

  &:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    .todo-item__actions {
      opacity: 1;
    }
  }

  &--completed &__text {
    text-decoration: line-through;
    opacity: 0.5;
  }

  &__view {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 14px 16px;
    gap: 12px;
  }

  &__checkbox {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    cursor: pointer;

    input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;

      &:checked + .todo-item__checkmark {
        background: var(--color-primary);
        border-color: var(--color-primary);

        &::after {
          display: block;
        }
      }
    }
  }

  &__checkmark {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 2px solid var(--color-border);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      content: "";
      display: none;
      width: 5px;
      height: 10px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
      margin-bottom: 2px;
    }
  }

  &__text {
    flex: 1;
    font-size: 15px;
    line-height: 1.4;
    color: var(--color-text);
    cursor: default;
    word-break: break-word;
  }

  &__actions {
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &__btn {
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

    &--edit:hover {
      background: var(--color-primary-light);
      color: var(--color-primary);
    }

    &--delete:hover {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }
  }

  &__edit {
    width: 100%;
    padding: 6px 8px;
  }

  &__edit-input {
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
}
</style>
