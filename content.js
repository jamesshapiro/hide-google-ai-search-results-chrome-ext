"use strict";

// Hide Google's "AI Overview" block and reclaim its reserved vertical space.
//
// The CSS file already hides the module before first paint. This script is a
// resilient fallback for two cases the static CSS can't cover:
//   1. Results (and the AI Overview) are injected/streamed in after load.
//   2. Google rotates the jsname/class, but the visible "AI Overview"
//      heading text stays put.
//
// Key detail: the AI Overview content (div[jsname="V3qe9d"]) is nested inside
// containers that carry an inline min-height (~383-384px). Hiding only that
// inner content leaves an empty gap, so we always climb up to the AI Overview
// *module* wrapper (which sits above the min-height containers) and hide that
// instead.

const WRAPPER_SELECTOR = 'div[jsname="V3qe9d"]';

// The module wrapper that encloses the whole AI Overview (header, content,
// sources, and the streamed "Ask anything" box) and sits above the
// min-height-bearing containers.
const MODULE_SELECTOR = 'div[jsname="ZLxsqf"], div[data-tma]';

// Stop climbing once we reach one of the search result containers; hide the
// block that sits directly inside it rather than the whole column.
const STOP_IDS = new Set(["rso", "center_col", "rcnt", "search"]);

function hide(el) {
  if (el && !el.classList.contains("hgaio-hidden")) {
    el.classList.add("hgaio-hidden");
  }
}

// Given any element inside the AI Overview, return the highest sensible block
// to hide so that no empty min-height gap is left behind.
function blockToHide(el) {
  // Prefer the module wrapper if present (collapses the min-height ancestors).
  const moduleWrapper = el.closest(MODULE_SELECTOR);
  if (moduleWrapper) return moduleWrapper;

  // Otherwise climb to the block that sits directly in a results container.
  let node = el;
  while (node && node.parentElement) {
    const parent = node.parentElement;
    if (parent.id && STOP_IDS.has(parent.id)) return node;
    node = parent;
  }
  return el;
}

function hideByWrapper(root) {
  root.querySelectorAll(WRAPPER_SELECTOR).forEach((w) => hide(blockToHide(w)));
}

function hideByHeading(root) {
  const headings = root.querySelectorAll('[role="heading"]');
  for (const h of headings) {
    if (h.textContent.trim() !== "AI Overview") continue;
    hide(blockToHide(h));
  }
}

function sweep(root) {
  if (!root || root.nodeType !== Node.ELEMENT_NODE) root = document;
  hideByWrapper(root);
  hideByHeading(root);
}

// Initial sweep (also catch anything present at document_start).
sweep(document);
document.addEventListener("DOMContentLoaded", () => sweep(document));

// Watch for streamed/injected results.
const observer = new MutationObserver((mutations) => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType === Node.ELEMENT_NODE) sweep(node);
    }
  }
});

function startObserving() {
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (document.documentElement) {
  startObserving();
} else {
  document.addEventListener("readystatechange", startObserving, { once: true });
}
