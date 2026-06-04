import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import LangSwitch from "@/components/LangSwitch.vue";
import { SUPPORTED_LOCALES, i18n } from "@/i18n";
import { globalMountOptions, resetLocale } from "@/test/i18n";

beforeEach(() => {
  resetLocale("ua");
});

const mountSwitch = () =>
  mount(LangSwitch, { global: globalMountOptions });

describe("LangSwitch", () => {
  it("renders one button per supported locale", () => {
    const wrapper = mountSwitch();
    const buttons = wrapper.findAll(".lang-switch__btn");
    expect(buttons).toHaveLength(SUPPORTED_LOCALES.length);
  });

  it("marks the active locale", () => {
    const wrapper = mountSwitch();
    const ua = wrapper.find('[data-testid="lang-ua"]');
    const en = wrapper.find('[data-testid="lang-en"]');
    expect(ua.classes()).toContain("lang-switch__btn--active");
    expect(en.classes()).not.toContain("lang-switch__btn--active");
  });

  it("switches the active locale on click", async () => {
    const wrapper = mountSwitch();
    await wrapper.find('[data-testid="lang-en"]').trigger("click");

    expect(i18n.global.locale.value).toBe("en");
    expect(wrapper.find('[data-testid="lang-en"]').classes()).toContain(
      "lang-switch__btn--active",
    );
    expect(wrapper.find('[data-testid="lang-ua"]').classes()).not.toContain(
      "lang-switch__btn--active",
    );
  });

  it("persists the selection to localStorage", async () => {
    const wrapper = mountSwitch();
    await wrapper.find('[data-testid="lang-en"]').trigger("click");
    expect(localStorage.getItem("todo-locale-v1")).toBe("en");
  });
});
