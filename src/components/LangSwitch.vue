<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { SUPPORTED_LOCALES, setLocale } from "@/i18n";

defineOptions({
  name: "LangSwitch",
});

const { locale } = useI18n();
</script>

<template>
  <div class="lang-switch" data-testid="lang-switch">
    <button
      v-for="loc in SUPPORTED_LOCALES"
      :key="loc"
      class="lang-switch__btn"
      :class="{ 'lang-switch__btn--active': locale === loc }"
      type="button"
      :data-testid="`lang-${loc}`"
      @click="setLocale(loc)"
    >
      {{ loc.toUpperCase() }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.lang-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: 10px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);

  &__btn {
    padding: 4px 12px;
    border: none;
    border-radius: 7px;
    background: transparent;
    color: var(--color-text-muted);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    font-family: inherit;

    &:hover {
      color: var(--color-text);
    }

    &--active {
      background: var(--color-primary);
      color: #fff;
    }

    &--active:hover {
      color: #fff;
    }
  }
}
</style>
