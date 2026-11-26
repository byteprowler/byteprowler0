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

describe("Stage 3.1 3D Hero, Fallback & Hybrid Navigation", () => {
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

    expect(screen.queryByRole("button", { name: "Unmasked" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Half-Body" })).not.toBeInTheDocument();

    expect(
      await screen.findByAltText(/ByteProwler V3 — The Midnight Developer half-body anime character/i),
    ).toBeInTheDocument();
  });

  it("renders Navbar with preserved logo, 7 section links, and controls character, quality preset & motion via Ctrl+K", async () => {
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

    fireEvent.change(input, { target: { value: "Contact" } });
    expect(screen.getByRole("option", { name: /Jump to Contact/i })).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "3D Graphics Quality: Medium" } });
    fireEvent.click(screen.getByRole("option", { name: /3D Graphics Quality: Medium/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    const reopenedInput = screen.getByLabelText("Filter commands");
    fireEvent.change(reopenedInput, { target: { value: "3D Graphics Quality: Medium" } });
    expect(screen.getByRole("option", { name: /3D Graphics Quality: Medium.*Active/i })).toBeInTheDocument();

    fireEvent.change(reopenedInput, { target: { value: "Restore Full Animations" } });
    fireEvent.click(screen.getByRole("option", { name: /Restore Full Animations/i }));

    expect(window.localStorage.getItem("byteprowler_v3_motion_pref")).toBe("system");
  });
});
