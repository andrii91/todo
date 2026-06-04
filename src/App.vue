<template>
  <div class="app">
    <header class="app__header">
      <LangSwitch class="app__lang" />
      <h1 class="app__title">Todo</h1>
      <p class="app__subtitle">{{ t("app.subtitle") }}</p>
    </header>

    <main class="app__main">
      <AddTodoForm @add="addTodo" />

      <div v-if="totalCount > 0" class="toolbar">
        <span class="toolbar__counter" data-testid="counter">
          {{ t("toolbar.counter", { completed: completedCount, total: totalCount }) }}
        </span>

        <div class="toolbar__actions">
          <AppButton
            variant="share"
            icon="↗"
            data-testid="share-btn"
            @click="handleShare"
          >
            {{ t("toolbar.share") }}
          </AppButton>
          <AppButton variant="clear" data-testid="clear-btn" @click="confirmClear">
            {{ t("toolbar.clearAll") }}
          </AppButton>
        </div>
      </div>

      <Transition name="toast">
        <div
          v-if="shareMessage"
          class="toast"
          role="status"
          aria-live="polite"
          data-testid="toast"
        >
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

      <div v-if="totalCount === 0" class="empty-state" data-testid="empty-state">
        <div class="empty-state__icon">📝</div>
        <p class="empty-state__text">{{ t("empty.text") }}</p>
        <p class="empty-state__hint">{{ t("empty.hint") }}</p>
      </div>

      <Transition name="fade">
        <div
          v-if="showConfirmClear"
          class="modal-overlay"
          data-testid="confirm-clear-modal"
          @click.self="showConfirmClear = false"
        >
          <div class="modal" role="dialog" aria-modal="true">
            <p class="modal__text">{{ t("confirmClear.text") }}</p>
            <div class="modal__actions">
              <AppButton
                variant="cancel"
                data-testid="confirm-clear-cancel"
                @click="showConfirmClear = false"
              >
                {{ t("common.cancel") }}
              </AppButton>
              <AppButton
                variant="danger"
                data-testid="confirm-clear-confirm"
                @click="handleClearAll"
              >
                {{ t("common.delete") }}
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="fade">
        <div
          v-if="pendingImport"
          class="modal-overlay"
          data-testid="import-modal"
          @click.self="dismissImport"
        >
          <div class="modal" role="dialog" aria-modal="true">
            <p class="modal__text">
              {{ t("importPrompt.text", { count: pendingImport.length }) }}
            </p>
            <div class="modal__actions">
              <AppButton
                variant="cancel"
                data-testid="import-cancel"
                @click="dismissImport"
              >
                {{ t("common.cancel") }}
              </AppButton>
              <AppButton
                variant="primary"
                data-testid="import-merge"
                @click="applyImport('merge')"
              >
                {{ t("importPrompt.merge") }}
              </AppButton>
              <AppButton
                variant="danger"
                data-testid="import-replace"
                @click="applyImport('replace')"
              >
                {{ t("importPrompt.replace") }}
              </AppButton>
            </div>
          </div>
        </div>
      </Transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import TodoItem from "@/components/TodoItem.vue";
import LangSwitch from "@/components/LangSwitch.vue";
import AddTodoForm from "@/components/AddTodoForm.vue";
import AppButton from "@/components/AppButton.vue";
import { useTodos } from "@/composables/useTodos";

defineOptions({
  name: "App",
});

const { t } = useI18n();

// Keep the document title in sync with the active locale.
watchEffect(() => {
  document.title = t("app.title");
});

const {
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
} = useTodos();

const shareMessage = ref("");
const showConfirmClear = ref(false);

const completedCount = computed(
  () => todos.value.filter((t) => t.completed).length,
);

const totalCount = computed(() => todos.value.length);

const handleShare = async (): Promise<void> => {
  const result = await share();
  // User dismissed the native share sheet — stay silent.
  if (result === "canceled") return;
  shareMessage.value = t(`share.${result}`);
  setTimeout(() => (shareMessage.value = ""), 2500);
};

const confirmClear = (): void => {
  showConfirmClear.value = true;
};

const handleClearAll = (): void => {
  clearAll();
  showConfirmClear.value = false;
};
</script>

<style scoped lang="scss">
.app {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px 80px;

  &__header {
    position: relative;
    text-align: center;
    margin-bottom: 32px;
  }

  &__title {
    font-size: 42px;
    font-weight: 800;
    color: var(--color-primary);
    letter-spacing: -1px;
    margin: 0;
  }

  &__subtitle {
    color: var(--color-text-muted);
    font-size: 15px;
    margin: 4px 0 0;
  }

  &__main {
    width: 100%;
    max-width: 560px;
  }

  &__lang {
    margin-bottom: 16px;
  }
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;

  &__counter {
    font-size: 13px;
    color: var(--color-text-muted);
    font-weight: 500;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
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

  &__icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  &__text {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    margin: 0 0 4px;
  }

  &__hint {
    font-size: 14px;
    color: var(--color-text-muted);
    margin: 0;
  }
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

  &__text {
    font-size: 17px;
    font-weight: 600;
    margin: 0 0 24px;
    color: var(--color-text);
  }

  &__actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    flex-wrap: wrap;
  }
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
