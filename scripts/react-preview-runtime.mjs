import React from "react";
import { createRoot } from "react-dom/client";
import * as jsx from "react/jsx-runtime";
import * as motion from "motion/react";

const modules = {
  react: React,
  "react/jsx-runtime": jsx,
  "motion/react": motion,
};
const root = document.getElementById("button-preview");
const status = document.getElementById("preview-status");

function report(message) {
  status.textContent = message;
  parent.postMessage({ type: "react-button-preview", valid: !message }, "*");
}

function check() {
  const control = "button, [role=button], [role=switch]";
  const buttons = [...root.querySelectorAll(control)];
  const text = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = text.nextNode(); node; node = text.nextNode()) {
    if (
      node.textContent.trim() &&
      !node.parentElement.closest(
        `${control}, svg, [role=status], [role=alert], [aria-live]`,
      )
    ) {
      report(
        "Keep visible text inside the button or an accessible status message.",
      );
      return;
    }
  }
  report(
    buttons.length >= 1 &&
      buttons.length <= 6 &&
      !buttons.some((button) => button.parentElement.closest(control)) &&
      !root.querySelector(
        "form, nav, main, article, section, iframe, input, textarea, select",
      )
      ? ""
      : "Render one button or a group of up to six buttons.",
  );
}

class PreviewBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    report("The component could not render. Check its source and imports.");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

globalThis.renderButton = (factory) => {
  const module = { exports: {} };
  try {
    factory(module, module.exports, (name) => {
      if (!Object.hasOwn(modules, name)) throw new Error("Unsupported import");
      return modules[name];
    });
    new MutationObserver(check).observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    createRoot(root).render(
      React.createElement(
        PreviewBoundary,
        null,
        React.createElement(module.exports.default),
      ),
    );
  } catch {
    report(
      "The component could not render. Export a default button component.",
    );
  }
};
