<script setup lang="ts">
import { ref, computed } from "vue";
import TodoItem from "./components/TodoItem.vue";
import { useTodos } from "./composables/useTodos";

defineOptions({
  name: "App",
});

const { todos, addTodo, removeTodo, toggleTodo, updateTodo, clearAll, share } =
  useTodos();

const newTodoText = ref("");
const shareMessage = ref("");
const showConfirmClear = ref(false);

const completedCount = computed(
  () => todos.value.filter((t) => t.completed).length,
);

const totalCount = computed(() => todos.value.length);

function handleAdd(): void {
  addTodo(newTodoText.value);
  newTodoText.value = "";
}

async function handleShare(): Promise<void> {
  const success = await share();
  shareMessage.value = success
    ? "Посилання скопійовано!"
    : "Не вдалось скопіювати";
  setTimeout(() => (shareMessage.value = ""), 2500);
}

function confirmClear(): void {
  showConfirmClear.value = true;
}

function handleClearAll(): void {
  clearAll();
  showConfirmClear.value = false;
}
</script>

<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">Todo</h1>
      <p class="app-subtitle">Організуй свій день</p>
    </header>

    <main class="app-main">
      <form class="add-form" @submit.prevent="handleAdd">
        <input
          v-model="newTodoText"
          class="add-input"
          type="text"
          placeholder="Що потрібно зробити?"
          autofocus
        />
        <button class="btn btn-add" type="submit" :disabled="!newTodoText.trim()">
          Додати
        </button>
      </form>

      <div v-if="totalCount > 0" class="toolbar">
        <span class="counter">
          {{ completedCount }} / {{ totalCount }} виконано
        </span>

        <div class="toolbar-actions">
          <button class="btn btn-share" @click="handleShare">
            <span class="btn-icon-text">↗</span>
            Поділитись
          </button>
          <button class="btn btn-clear" @click="confirmClear">
            Очистити все
          </button>
        </div>
      </div>

      <Transition name="toast">
        <div v-if="shareMessage" class="toast">
          {{ shareMessage }}
        </div>
      </Transition>

      <TransitionGroup name="list" tag="ul" class="todo-list">
        <TodoItem
          v-for="todo in todos"
          :key="todo.id"
          :todo="todo"
          @toggle="toggleTodo"
          @remove="removeTodo"
          @update="updateTodo"
        />
      </TransitionGroup>

      <div v-if="totalCount === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p class="empty-text">Список порожній</p>
        <p class="empty-hint">Додай перше завдання вище</p>
      </div>

      <Transition name="fade">
        <div v-if="showConfirmClear" class="modal-overlay" @click.self="showConfirmClear = false">
          <div class="modal">
            <p class="modal-text">Видалити всі завдання?</p>
            <div class="modal-actions">
              <button class="btn btn-cancel" @click="showConfirmClear = false">
                Скасувати
              </button>
              <button class="btn btn-danger" @click="handleClearAll">
                Видалити
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px 80px;
}

.app-header {
  text-align: center;
  margin-bottom: 32px;
}

.app-title {
  font-size: 42px;
  font-weight: 800;
  color: var(--color-primary);
  letter-spacing: -1px;
  margin: 0;
}

.app-subtitle {
  color: var(--color-text-muted);
  font-size: 15px;
  margin: 4px 0 0;
}

.app-main {
  width: 100%;
  max-width: 560px;
}

.add-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.add-input {
  flex: 1;
  padding: 14px 18px;
  border: 2px solid var(--color-border);
  border-radius: 14px;
  font-size: 15px;
  background: var(--color-surface);
  color: var(--color-text);
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

.add-input:focus {
  border-color: var(--color-primary);
}

.add-input::placeholder {
  color: var(--color-text-muted);
}

.btn {
  padding: 12px 20px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-add {
  background: var(--color-primary);
  color: #fff;
}

.btn-add:not(:disabled):hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}

.counter {
  font-size: 13px;
  color: var(--color-text-muted);
  font-weight: 500;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.btn-share {
  background: var(--color-surface);
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-share:hover {
  background: var(--color-primary-light);
}

.btn-icon-text {
  font-size: 16px;
  line-height: 1;
}

.btn-clear {
  background: transparent;
  color: var(--color-text-muted);
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
}

.btn-clear:hover {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.toast {
  text-align: center;
  padding: 10px 20px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 48px 16px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px;
}

.empty-hint {
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--color-surface);
  border-radius: 20px;
  padding: 32px;
  max-width: 340px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.modal-text {
  font-size: 17px;
  font-weight: 600;
  margin: 0 0 24px;
  color: var(--color-text);
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-cancel {
  background: var(--color-border);
  color: var(--color-text);
  padding: 10px 24px;
}

.btn-cancel:hover {
  opacity: 0.8;
}

.btn-danger {
  background: var(--color-danger);
  color: #fff;
  padding: 10px 24px;
}

.btn-danger:hover {
  opacity: 0.9;
}

/* Transitions */
.list-enter-active {
  transition: all 0.3s ease;
}

.list-leave-active {
  transition: all 0.25s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-12px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.3s ease;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
