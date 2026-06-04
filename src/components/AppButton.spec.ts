import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AppButton from "@/components/AppButton.vue";

describe("AppButton", () => {
  it("renders slot content", () => {
    const wrapper = mount(AppButton, { slots: { default: "Click me" } });
    expect(wrapper.text()).toContain("Click me");
  });

  it("applies the primary variant class by default", () => {
    const wrapper = mount(AppButton);
    expect(wrapper.classes()).toContain("app-btn");
    expect(wrapper.classes()).toContain("app-btn--primary");
  });

  it("applies the given variant class", () => {
    const wrapper = mount(AppButton, { props: { variant: "danger" } });
    expect(wrapper.classes()).toContain("app-btn--danger");
  });

  it("renders the icon when provided", () => {
    const wrapper = mount(AppButton, { props: { icon: "↗" } });
    const icon = wrapper.find('[data-testid="app-button-icon"]');
    expect(icon.exists()).toBe(true);
    expect(icon.text()).toBe("↗");
  });

  it("omits the icon element when no icon is given", () => {
    const wrapper = mount(AppButton);
    expect(wrapper.find('[data-testid="app-button-icon"]').exists()).toBe(false);
  });

  it("forwards the type attribute", () => {
    const wrapper = mount(AppButton, { props: { type: "submit" } });
    expect(wrapper.attributes("type")).toBe("submit");
  });

  it("defaults to type button", () => {
    const wrapper = mount(AppButton);
    expect(wrapper.attributes("type")).toBe("button");
  });

  it("reflects the disabled prop", () => {
    const wrapper = mount(AppButton, { props: { disabled: true } });
    expect(wrapper.attributes("disabled")).toBeDefined();
  });

  it("emits click when enabled", async () => {
    const wrapper = mount(AppButton);
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
  });

  it("does not emit click when disabled", async () => {
    const wrapper = mount(AppButton, { props: { disabled: true } });
    await wrapper.trigger("click");
    expect(wrapper.emitted("click")).toBeUndefined();
  });
});
