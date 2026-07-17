import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WeatherAccuracyNote } from "./WeatherAccuracyNote";

describe("<WeatherAccuracyNote>", () => {
  afterEach(() => {
    cleanup();
  });

  describe("block variant", () => {
    it("renders the inline accuracy caption with role=note", () => {
      render(<WeatherAccuracyNote variant="block" />);
      const note = screen.getByRole("note");
      expect(note).toBeInTheDocument();
      expect(note).toHaveTextContent(/forecast is approximate/i);
      expect(note).toHaveTextContent(/verify on site/i);
    });
  });

  describe("compact variant", () => {
    it("renders the trigger button with the Forecast accuracy label and no body", () => {
      render(<WeatherAccuracyNote variant="compact" />);
      const trigger = screen.getByRole("button", { name: "Forecast accuracy" });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens the popover with the body text when the trigger is clicked", async () => {
      const user = userEvent.setup();
      render(<WeatherAccuracyNote variant="compact" />);
      await user.click(screen.getByRole("button", { name: "Forecast accuracy" }));
      const dialog = await screen.findByRole("dialog", { name: "Forecast accuracy" });
      expect(dialog).toHaveTextContent(/forecast is approximate/i);
      expect(dialog).toHaveTextContent(/verify on site/i);
    });
  });
});
