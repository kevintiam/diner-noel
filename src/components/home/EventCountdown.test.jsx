import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventCountdown from "./EventCountdown";

const START_TIME = Date.parse("2026-12-19T23:00:00Z");
const DICTIONARY = {
  countdown: {
    title: "Avant de nous retrouver",
    started: "La célébration a commencé.",
    days: "Jours",
    hours: "Heures",
    minutes: "Minutes",
    seconds: "Secondes",
  },
};

afterEach(() => {
  vi.useRealTimers();
});

describe("EventCountdown", () => {
  it("affiche les quatre unités avec l'instant initial du serveur", () => {
    render(
      <EventCountdown
        startsAt={new Date(START_TIME).toISOString()}
        initialNow={START_TIME - 2000}
        dictionary={DICTIONARY}
      />,
    );

    expect(screen.getByRole("heading", { name: "Avant de nous retrouver" })).toBeInTheDocument();
    expect(screen.getByText("Secondes")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
  });

  it("passe à l'état terminé à l'heure du dîner et libère son minuteur", () => {
    vi.useFakeTimers();
    vi.setSystemTime(START_TIME - 2000);
    const { unmount } = render(
      <EventCountdown
        startsAt={new Date(START_TIME).toISOString()}
        initialNow={Date.now()}
        dictionary={DICTIONARY}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("La célébration a commencé.");
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ne démarre pas de minuteur quand le dîner a déjà commencé", () => {
    vi.useFakeTimers();
    render(
      <EventCountdown
        startsAt={new Date(START_TIME).toISOString()}
        initialNow={START_TIME + 1000}
        dictionary={DICTIONARY}
      />,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });
});
