import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// --- Mock framer-motion so we can inspect the props (variants/transition)
// passed by Reveal/StaggerGroup/StaggerItem/RouteTransition without needing
// a full animation runtime.
const reducedMotionRef = { current: false };

vi.mock("framer-motion", () => {
  const React = require("react");
  const make = (tag: string) =>
    React.forwardRef((props: any, ref: any) => {
      const { children, variants, initial, animate, exit, transition, whileInView, viewport, ...rest } = props;
      return React.createElement(
        tag,
        {
          ref,
          "data-variants": variants ? JSON.stringify(variants) : undefined,
          "data-transition": transition ? JSON.stringify(transition) : undefined,
          "data-initial": initial ? JSON.stringify(initial) : undefined,
          "data-animate": animate ? JSON.stringify(animate) : undefined,
          "data-exit": exit ? JSON.stringify(exit) : undefined,
          ...rest,
        },
        children
      );
    });
  const motion: any = new Proxy(
    {},
    {
      get: (_t, key: string) => make(key),
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useReducedMotion: () => reducedMotionRef.current,
  };
});

// Mock the perf guard so we control "low-end" independently.
const motionGuardRef = { current: false };
vi.mock("@/hooks/useMotionGuard", () => ({
  useMotionGuard: () => motionGuardRef.current,
  observeOnce: () => () => {},
}));

import { Reveal, StaggerGroup, StaggerItem } from "@/components/Reveal";
import RouteTransition from "@/components/RouteTransition";

beforeEach(() => {
  reducedMotionRef.current = false;
  motionGuardRef.current = false;
});

function parse(el: Element | null, attr: string) {
  return el ? JSON.parse(el.getAttribute(attr) || "null") : null;
}

describe("Reveal", () => {
  it("uses full animation by default", () => {
    const { container } = render(<Reveal y={24}>hi</Reveal>);
    const v = parse(container.firstElementChild, "data-variants");
    expect(v.hidden.y).toBe(24);
    expect(v.show.transition.duration).toBeCloseTo(0.6);
    expect(v.show.transition.delay).toBe(0);
  });

  it("shortens duration and zeroes y when prefers-reduced-motion", () => {
    reducedMotionRef.current = true;
    const { container } = render(<Reveal y={24} delay={0.5}>hi</Reveal>);
    const v = parse(container.firstElementChild, "data-variants");
    expect(v.hidden.y).toBe(0);
    expect(v.show.transition.duration).toBeCloseTo(0.2);
    expect(v.show.transition.delay).toBe(0);
  });

  it("shortens duration and zeroes y when motion guard activates", () => {
    motionGuardRef.current = true;
    const { container } = render(<Reveal y={40} delay={0.3}>hi</Reveal>);
    const v = parse(container.firstElementChild, "data-variants");
    expect(v.hidden.y).toBe(0);
    expect(v.show.transition.duration).toBeCloseTo(0.2);
    expect(v.show.transition.delay).toBe(0);
  });
});

describe("StaggerGroup / StaggerItem", () => {
  it("staggers children by default", () => {
    const { container } = render(
      <StaggerGroup stagger={0.08}>
        <StaggerItem y={24}>a</StaggerItem>
      </StaggerGroup>
    );
    const groupVariants = parse(container.firstElementChild, "data-variants");
    expect(groupVariants.show.transition.staggerChildren).toBeCloseTo(0.08);
    const itemVariants = parse(container.firstElementChild!.firstElementChild, "data-variants");
    expect(itemVariants.hidden.y).toBe(24);
    expect(itemVariants.show.transition.duration).toBeCloseTo(0.5);
  });

  it("disables stagger and item slide when reduced motion", () => {
    reducedMotionRef.current = true;
    const { container } = render(
      <StaggerGroup stagger={0.08}>
        <StaggerItem y={24}>a</StaggerItem>
      </StaggerGroup>
    );
    const groupVariants = parse(container.firstElementChild, "data-variants");
    expect(groupVariants.show.transition.staggerChildren).toBe(0);
    const itemVariants = parse(container.firstElementChild!.firstElementChild, "data-variants");
    expect(itemVariants.hidden.y).toBe(0);
    expect(itemVariants.show.transition.duration).toBeCloseTo(0.2);
  });

  it("disables stagger when motion guard activates", () => {
    motionGuardRef.current = true;
    const { container } = render(
      <StaggerGroup stagger={0.12}>
        <StaggerItem y={24}>a</StaggerItem>
      </StaggerGroup>
    );
    const groupVariants = parse(container.firstElementChild, "data-variants");
    expect(groupVariants.show.transition.staggerChildren).toBe(0);
  });
});

describe("RouteTransition", () => {
  const renderRT = () =>
    render(
      <MemoryRouter initialEntries={["/x"]}>
        <RouteTransition>
          <span>page</span>
        </RouteTransition>
      </MemoryRouter>
    );

  it("uses default 0.25s duration with subtle slide", () => {
    const { container } = renderRT();
    const inner = container.firstElementChild!;
    expect(parse(inner, "data-transition").duration).toBeCloseTo(0.25);
    expect(parse(inner, "data-initial").y).toBe(8);
    expect(parse(inner, "data-exit").y).toBe(-8);
  });

  it("shortens duration and removes slide when reduced motion", () => {
    reducedMotionRef.current = true;
    const { container } = renderRT();
    const inner = container.firstElementChild!;
    expect(parse(inner, "data-transition").duration).toBeCloseTo(0.15);
    expect(parse(inner, "data-initial").y).toBe(0);
    expect(parse(inner, "data-exit").y).toBe(0);
  });

  it("shortens duration and removes slide when motion guard activates", () => {
    motionGuardRef.current = true;
    const { container } = renderRT();
    const inner = container.firstElementChild!;
    expect(parse(inner, "data-transition").duration).toBeCloseTo(0.15);
    expect(parse(inner, "data-initial").y).toBe(0);
    expect(parse(inner, "data-exit").y).toBe(0);
  });
});