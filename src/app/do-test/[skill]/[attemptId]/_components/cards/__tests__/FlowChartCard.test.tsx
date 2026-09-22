// @vitest-environment happy-dom
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { FlowChartCard } from "../FlowChartCard";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe("FlowChartCard", () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(async () => {
    if (root) {
      await React.act(async () => {
        root?.unmount();
      });
      root = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
      container = null;
    }
  });

  it("renders steps from flowChartNodes when orderCorrects is empty (live exam case)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const nodes = [
      { key: "dry-resulting-sheet", label: "dry resulting sheet" },
      { key: "press-fibres-into-mat", label: "press fibres into mat" },
      { key: "collect-raw-materials", label: "collect raw materials" },
      { key: "soak-fibres-in-water", label: "soak fibres in water" },
    ];

    const promptMd = `Available steps:
A. [1] the fibres in water
B. [2] the resulting [4] in the sun
C. Collect raw materials such as rags, hemp and fishnets
D. Press the fibres into a [3]`;

    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <FlowChartCard
          flowChartNodes={nodes}
          promptMd={promptMd}
          orderCorrects={null}
          blankAcceptTexts={null}
          onChange={onChange}
        />
      );
    });

    // Verify all 4 steps are rendered
    expect(container.textContent).toContain("dry resulting sheet");
    expect(container.textContent).toContain("press fibres into mat");
    expect(container.textContent).toContain("collect raw materials");
    expect(container.textContent).toContain("soak fibres in water");

    // Verify blanks [1], [2], [3], [4] are rendered
    expect(container.textContent).toContain("Blank [1]");
    expect(container.textContent).toContain("Blank [2]");
    expect(container.textContent).toContain("Blank [3]");
    expect(container.textContent).toContain("Blank [4]");
  });

  it("renders only reordering steps when prompt has no blanks (e.g. vertical farming Q12)", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const nodes = [
      { key: "led-lights", label: "LED lights simulate natural sunlight" },
      { key: "sensors-monitor", label: "Sensors monitor plant health in real time" },
    ];

    const promptMd = "Arrange the steps in chronological order without any blanks.";

    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <FlowChartCard
          flowChartNodes={nodes}
          promptMd={promptMd}
          orderCorrects={null}
          blankAcceptTexts={null}
          onChange={onChange}
        />
      );
    });

    expect(container.textContent).toContain("LED lights simulate natural sunlight");
    expect(container.textContent).toContain("Sensors monitor plant health in real time");
    expect(container.textContent).not.toContain("Blank [");
  });

  it("triggers onChange when moving steps or typing blank answers", async () => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    const nodes = [
      { key: "step-a", label: "Step A" },
      { key: "step-b", label: "Step B" },
    ];

    const promptMd = "A. [1] first step\nB. second step";
    const onChange = vi.fn();

    await React.act(async () => {
      root?.render(
        <FlowChartCard
          flowChartNodes={nodes}
          promptMd={promptMd}
          orderCorrects={null}
          blankAcceptTexts={null}
          onChange={onChange}
        />
      );
    });

    // Move first item down
    const downButtons = container.querySelectorAll<HTMLButtonElement>('button[title="Move down"]');
    expect(downButtons.length).toBeGreaterThan(0);

    await React.act(async () => {
      downButtons[0]?.click();
    });

    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(lastCall).toHaveProperty("steps");
    expect(lastCall.steps).toEqual(["step-b", "step-a"]);

    // Type into blank [1]
    const input = container.querySelector<HTMLInputElement>("input");
    expect(input).not.toBeNull();

    await React.act(async () => {
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          "value"
        )?.set;
        setter?.call(input, "soak");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    const afterInputCall = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0];
    expect(afterInputCall.labels).toHaveProperty("1", "soak");
  });
});
