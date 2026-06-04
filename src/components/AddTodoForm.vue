<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import AppButton from "@/components/AppButton.vue";

defineOptions({
  name: "AddTodoForm",
});

const emit = defineEmits<{
  add: [text: string];
}>();

const { t } = useI18n();
const text = ref("");

const handleSubmit = (): void => {
  const trimmed = text.value.trim();
  if (!trimmed) return;
  emit("add", trimmed);
  text.value = "";
};
</script>

<template>
  <form class="add-form" data-testid="add-form" @submit.prevent="handleSubmit">
    <input
      v-model="text"
      class="add-form__input"
      type="text"
      :placeholder="t('addForm.placeholder')"
      autofocus
      data-testid="add-input"
    />
    <AppButton
      type="submit"
      variant="primary"
      :disabled="!text.trim()"
      data-testid="add-submit"
    >
      {{ t("addForm.add") }}
    </AppButton>
  </form>
</template>

<style scoped lang="scss">
.add-form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  &__input {
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

    &:focus {
      border-color: var(--color-primary);
    }

    &::placeholder {
      color: var(--color-text-muted);
    }
  }
}
</style>
