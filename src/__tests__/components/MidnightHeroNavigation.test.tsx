import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import Hero from "../../components/sections/Hero";
import Navbar from "../../components/layout/Navbar";
import CommandInterface from "../../components/ui/CommandInterface";
import { MidnightRealmProvider } from "../../context/MidnightRealmContext";

vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/",
    asPath: "/",
    isReady: true,
    push: vi.fn(),
    events: { on: vi.fn(), off: vi.fn() },
  }),
}));

describe("Stage 3 Reconstructed 3D Hero & Hybrid Navigation", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it("renders full-viewport Hero with verified identity, primary CTAs, static non-WebGL fallback in jsdom, and no hero character toolbar", async () => {
    window.localStorage.setItem("byteprowler_v3_motion_pref", "reduced");

    render(
      <MidnightRealmProvider>
        <Hero />
      </MidnightRealmProvider>,
    );

    expect(screen.getByRole("heading", { name: /ByteProwler/i })).toBeInTheDocument();
    expect(screen.getByText(/The Midnight Developer/i)).toBeInTheDocument();
    expect(screen.getByText(/Joshua Ogo/i)).toBeInTheDocument();
    expect(screen.getByText("バイトプロウラー")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore Projects/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /About Me/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resume/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Contact/i })).toBeInTheDocument();

    // Visible character mode/expression buttons should NOT clutter the hero canvas
    expect(screen.queryByRole("button", { name: "Unmasked" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Half-Body" })).not.toBeInTheDocument();

    // Non-WebGL jsdom environment should fall back cleanly to the static Midnight portrait
    expect(
      await screen.findByAltText(/ByteProwler V3 — The Midnight Developer half-body anime character/i),
    ).toBeInTheDocument();
  });

  it("renders Navbar with preserved logo, 7 section links, and controls character & motion states via Ctrl+K", async () => {
    window.localStorage.setItem("byteprowler_v3_motion_pref", "reduced");

    render(
      <MidnightRealmProvider>
        <Navbar />
        <CommandInterface />
        <Hero />
      </MidnightRealmProvider>,
    );

    expect(screen.getByAltText("ByteProwler brand logo")).toBeInTheDocument();
    const primaryNav = screen.getByRole("navigation", { name: "Primary sections" });
    for (const label of ["Home", "About", "Expertise", "Projects", "Experience", "Playground", "Contact"]) {
      expect(within(primaryNav).getByRole("link", { name: label })).toBeInTheDocument();
    }

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog", { name: "Command Navigation Interface" })).toBeInTheDocument();

    const input = screen.getByLabelText("Filter commands");

    // Verify Contact jump entry exists
    fireEvent.change(input, { target: { value: "Contact" } });
    expect(screen.getByRole("option", { name: /Jump to Contact/i })).toBeInTheDocument();

    // Verify character mask & expression states are controllable from Command Interface
    fireEvent.change(input, { target: { value: "Mask State: Unmasked" } });
    fireEvent.click(screen.getByRole("option", { name: /Mask State: Unmasked/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Re-open to verify active indicator updated and toggle motion preference
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const reopenedInput = screen.getByLabelText("Filter commands");
    fireEvent.change(reopenedInput, { target: { value: "Mask State: Unmasked" } });
    expect(screen.getByRole("option", { name: /Mask State: Unmasked.*Active/i })).toBeInTheDocument();

    fireEvent.change(reopenedInput, { target: { value: "Restore Full Animations" } });
    fireEvent.click(screen.getByRole("option", { name: /Restore Full Animations/i }));

    expect(window.localStorage.getItem("byteprowler_v3_motion_pref")).toBe("system");
  });
});
