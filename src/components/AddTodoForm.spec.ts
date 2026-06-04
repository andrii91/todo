import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import AddTodoForm from "@/components/AddTodoForm.vue";
import { globalMountOptions } from "@/test/i18n";

const mountForm = () =>
  mount(AddTodoForm, { global: globalMountOptions });

describe("AddTodoForm", () => {
  it("emits add with the entered text on submit", async () => {
    const wrapper = mountForm();
    await wrapper.find('[data-testid="add-input"]').setValue("Buy milk");
    await wrapper.find('[data-testid="add-form"]').trigger("submit");

    expect(wrapper.emitted("add")).toEqual([["Buy milk"]]);
  });

  it("trims surrounding whitespace before emitting", async () => {
    const wrapper = mountForm();
    await wrapper.find('[data-testid="add-input"]').setValue("  Walk dog  ");
    await wrapper.find('[data-testid="add-form"]').trigger("submit");

    expect(wrapper.emitted("add")).toEqual([["Walk dog"]]);
  });

  it("clears the input after a successful submit", async () => {
    const wrapper = mountForm();
    const input = wrapper.find<HTMLInputElement>('[data-testid="add-input"]');
    await input.setValue("Something");
    await wrapper.find('[data-testid="add-form"]').trigger("submit");

    expect(input.element.value).toBe("");
  });

  it("does not emit when the input is empty or whitespace only", async () => {
    const wrapper = mountForm();
    await wrapper.find('[data-testid="add-input"]').setValue("   ");
    await wrapper.find('[data-testid="add-form"]').trigger("submit");

    expect(wrapper.emitted("add")).toBeUndefined();
  });

  it("disables the submit button while the input is empty", async () => {
    const wrapper = mountForm();
    const submit = wrapper.find('[data-testid="add-submit"]');
    expect(submit.attributes("disabled")).toBeDefined();

    await wrapper.find('[data-testid="add-input"]').setValue("Task");
    expect(submit.attributes("disabled")).toBeUndefined();
  });
});
