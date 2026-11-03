export type PreviewOptions = {
  background?: string;
  disabled?: boolean;
  reducedMotion?: boolean;
  inspect?: boolean;
};
// Runs inside the opaque-origin preview. The parent accepts messages only from its own frame.
export function previewChecks(options: PreviewOptions) {
  return `<script>(${function (settings: PreviewOptions) {
    const selector =
      'button,a[href],input[type="button"],input[type="submit"],input[type="reset"],input[type="checkbox"],input[type="radio"],[role="button"],[role="switch"]';
    if (settings.disabled)
      document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.setAttribute("disabled", "");
        element.setAttribute("aria-disabled", "true");
        element.tabIndex = -1;
      });
    if (settings.disabled)
      document.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
        },
        true,
      );
    if (!settings.inspect) return;
    const run = () => {
      const issues: string[] = [];
      let checkedContrast = 0;
      let manualContrast = 0;
      const controls = [
        ...document.querySelectorAll<HTMLElement>(selector),
      ].filter(
        (element) =>
          element.getClientRects().length &&
          getComputedStyle(element).visibility !== "hidden",
      );
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const color = (value: string) => {
        if (!context) return null;
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = value;
        context.fillRect(0, 0, 1, 1);
        const rgba = context.getImageData(0, 0, 1, 1).data;
        return [rgba[0], rgba[1], rgba[2], rgba[3] / 255];
      };
      const luminance = (rgb: number[]) =>
        rgb
          .slice(0, 3)
          .map((part) => {
            const v = part / 255;
            return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          })
          .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const backdrop = (element: HTMLElement): number[] | null => {
        let result = [0, 0, 0, 0];
        let current: HTMLElement | null = element;
        while (current) {
          const style = getComputedStyle(current);
          if (
            style.backgroundImage !== "none" ||
            Number(style.opacity) < 1 ||
            style.mixBlendMode !== "normal"
          )
            return null;
          const bg = color(style.backgroundColor);
          if (!bg) return null;
          const alpha = result[3] + bg[3] * (1 - result[3]);
          if (alpha > 0)
            result = [0, 1, 2]
              .map(
                (i) =>
                  (result[i] * result[3] + bg[i] * bg[3] * (1 - result[3])) /
                  alpha,
              )
              .concat(alpha);
          if (result[3] >= 0.999) return result;
          current = current.parentElement;
        }
        return null;
      };
      controls.forEach((element, index) => {
        const copy = element.cloneNode(true) as HTMLElement;
        copy
          .querySelectorAll('[aria-hidden="true"],script,style')
          .forEach((item) => item.remove());
        const refs = (element.getAttribute("aria-labelledby") || "")
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent || "")
          .join(" ")
          .trim();
        const labels =
          "labels" in element
            ? [...((element as HTMLInputElement).labels || [])]
                .map((label) => label.textContent)
                .join(" ")
            : "";
        const name = (
          element.getAttribute("aria-label") ||
          refs ||
          labels ||
          copy.textContent ||
          [...copy.querySelectorAll("img[alt]")]
            .map((image) => image.getAttribute("alt"))
            .join(" ") ||
          element.getAttribute("value") ||
          element.getAttribute("title") ||
          ""
        ).trim();
        if (!name)
          issues.push(
            "Button " +
              (index + 1) +
              " needs an accessible name. Add visible text or aria-label.",
          );
        const disabled =
          element.hasAttribute("disabled") ||
          element.getAttribute("aria-disabled") === "true";
        const native = /^(BUTTON|INPUT|A)$/.test(element.tagName);
        if (!disabled && element.tabIndex < 0)
          issues.push("Button " + (index + 1) + " cannot be reached with Tab.");
        if (!native)
          issues.push(
            "Button " +
              (index + 1) +
              " uses a custom role. Verify Enter and Space activate it.",
          );
        const box = element.getBoundingClientRect();
        if (box.width < 24 || box.height < 24)
          issues.push(
            "Button " +
              (index + 1) +
              " has a target smaller than 24 × 24 pixels.",
          );
        if (!disabled && copy.textContent?.trim()) {
          const textNodes: HTMLElement[] = [
            element,
            ...element.querySelectorAll<HTMLElement>("*"),
          ].filter(
            (item) =>
              [...item.childNodes].some(
                (node) => node.nodeType === 3 && node.textContent?.trim(),
              ) && !item.closest('[aria-hidden="true"],svg'),
          );
          for (const item of textNodes) {
            const style = getComputedStyle(item);
            const fg = color(style.color);
            const bg = backdrop(item);
            if (
              !fg ||
              !bg ||
              fg[3] < 1 ||
              style.textShadow !== "none" ||
              style.backgroundClip === "text"
            ) {
              manualContrast++;
              continue;
            }
            const first = luminance(fg);
            const second = luminance(bg);
            const ratio =
              (Math.max(first, second) + 0.05) /
              (Math.min(first, second) + 0.05);
            const large =
              parseFloat(style.fontSize) >= 24 ||
              (parseFloat(style.fontSize) >= 18.66 &&
                parseInt(style.fontWeight) >= 700);
            checkedContrast++;
            if (ratio < (large ? 3 : 4.5))
              issues.push(
                "Button " +
                  (index + 1) +
                  " text contrast is " +
                  ratio.toFixed(2) +
                  ":1. Aim for " +
                  (large ? "3" : "4.5") +
                  ":1.",
              );
          }
        }
      });
      if (!controls.length)
        issues.push("No visible button controls were found in the preview.");
      parent.postMessage(
        {
          type: "button-preview-checks",
          controls: controls.length,
          issues: [...new Set(issues)].slice(0, 20),
          checkedContrast,
          manualContrast,
        },
        "*",
      );
    };
    if (document.readyState === "complete") setTimeout(run, 100);
    else
      window.addEventListener("load", () => setTimeout(run, 100), {
        once: true,
      });
    document.addEventListener("click", () => setTimeout(run, 100));
    document.addEventListener("keyup", () => setTimeout(run, 100));
  }.toString()})(${JSON.stringify(options)});</script>`;
}
