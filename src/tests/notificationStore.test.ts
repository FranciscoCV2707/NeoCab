import { describe, it, expect, beforeEach } from "vitest";
import { useNotificationStore } from "../stores/useNotificationStore";

describe("useNotificationStore", () => {
  beforeEach(() => {
    useNotificationStore.setState({
      toasts: [],
      queue: [],
      current: null,
    });
  });

  it("adds a toast", () => {
    const id = useNotificationStore.getState().addToast({
      type: "success",
      title: "Test",
      message: "Test message",
    });

    const toast = useNotificationStore.getState().toasts[0];
    expect(toast).toBeDefined();
    expect(toast.id).toBe(id);
    expect(toast.type).toBe("success");
    expect(toast.title).toBe("Test");
  });

  it("removes a toast", () => {
    const id = useNotificationStore.getState().addToast({
      type: "info",
      title: "To remove",
      message: "Will be removed",
    });

    expect(useNotificationStore.getState().toasts.length).toBe(1);
    useNotificationStore.getState().removeToast(id);
    expect(useNotificationStore.getState().toasts.length).toBe(0);
  });

  it("clears all toasts", () => {
    useNotificationStore.getState().addToast({ type: "success", title: "A", message: "a" });
    useNotificationStore.getState().addToast({ type: "error", title: "B", message: "b" });

    expect(useNotificationStore.getState().toasts.length).toBe(2);
    useNotificationStore.getState().clearAll();
    expect(useNotificationStore.getState().toasts.length).toBe(0);
  });

  it("shows success toast", () => {
    const id = useNotificationStore.getState().showSuccess("Success!", "It worked");
    const toast = useNotificationStore.getState().toasts.find((t) => t.id === id);
    expect(toast?.type).toBe("success");
  });

  it("shows error toast with duration 0", () => {
    const id = useNotificationStore.getState().showError("Error!", "It failed");
    const toast = useNotificationStore.getState().toasts.find((t) => t.id === id);
    expect(toast?.type).toBe("error");
    expect(toast?.duration).toBe(0);
  });
});