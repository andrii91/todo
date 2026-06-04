<script setup lang="ts">
defineOptions({
  name: "AppButton",
});

type Variant = "primary" | "share" | "clear" | "cancel" | "danger";

withDefaults(
  defineProps<{
    variant?: Variant;
    type?: "button" | "submit";
    disabled?: boolean;
    /** Optional leading glyph (e.g. "↗"). */
    icon?: string;
  }>(),
  {
    variant: "primary",
    type: "button",
    disabled: false,
    icon: undefined,
  },
);
</script>

<template>
  <button
    class="app-btn"
    :class="`app-btn--${variant}`"
    :type="type"
    :disabled="disabled"
  >
    <span v-if="icon" class="app-btn__icon" data-testid="app-button-icon">{{
      icon
    }}</span>
    <slot />
  </button>
</template>

<style scoped lang="scss">
.app-btn {
  padding: 12px 20px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
  white-space: nowrap;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &__icon {
    font-size: 16px;
    line-height: 1;
  }

  &--primary {
    background: var(--color-primary);
    color: #fff;

    &:not(:disabled):hover {
      background: var(--color-primary-hover);
      transform: translateY(-1px);
    }
  }

  &--share {
    background: var(--color-surface);
    color: var(--color-primary);
    border: 1.5px solid var(--color-primary);
    padding: 8px 16px;
    border-radius: 10px;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;

    &:hover {
      background: var(--color-primary-light);
    }
  }

  &--clear {
    background: transparent;
    color: var(--color-text-muted);
    padding: 8px 14px;
    border-radius: 10px;
    font-size: 13px;

    &:hover {
      background: var(--color-danger-light);
      color: var(--color-danger);
    }
  }

  &--cancel {
    background: var(--color-border);
    color: var(--color-text);
    padding: 10px 24px;

    &:hover {
      opacity: 0.8;
    }
  }

  &--danger {
    background: var(--color-danger);
    color: #fff;
    padding: 10px 24px;

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
