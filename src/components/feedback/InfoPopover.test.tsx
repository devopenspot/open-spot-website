import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoPopover } from "./InfoPopover";

describe("<InfoPopover>", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the trigger with the given label and is closed by default", () => {
    render(
      <InfoPopover triggerLabel="More info" trigger={<span>i</span>}>
        <p>Body content</p>
      </InfoPopover>,
    );
    const trigger = screen.getByRole("button", { name: "More info" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveAttribute("aria-controls");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens the popover when the trigger is clicked and exposes the panel with the trigger label", async () => {
    const user = userEvent.setup();
    render(
      <InfoPopover triggerLabel="Forecast accuracy" trigger={<span>i</span>}>
        <p>Body content</p>
      </InfoPopover>,
    );
    const trigger = screen.getByRole("button", { name: "Forecast accuracy" });
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = await screen.findByRole("dialog", { name: "Forecast accuracy" });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent("Body content");
  });

  it("closes the popover when the trigger is clicked a second time", async () => {
    const user = userEvent.setup();
    render(
      <InfoPopover triggerLabel="More info" trigger={<span>i</span>}>
        <p>Body content</p>
      </InfoPopover>,
    );
    const trigger = screen.getByRole("button", { name: "More info" });
    await user.click(trigger);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(trigger);
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the popover when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(
      <InfoPopover triggerLabel="More info" trigger={<span>i</span>}>
        <p>Body content</p>
      </InfoPopover>,
    );
    await user.click(screen.getByRole("button", { name: "More info" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes the popover when a mousedown happens outside the container", async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <InfoPopover triggerLabel="More info" trigger={<span>i</span>}>
          <p>Body content</p>
        </InfoPopover>
      </div>,
    );
    fireEvent.click(screen.getByRole("button", { name: "More info" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId("outside"));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
