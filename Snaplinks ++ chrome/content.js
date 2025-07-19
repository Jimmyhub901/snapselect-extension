// Snap Select for Chrome
// Autor: Jaime Mora G.
// Versión: 1.0
// Licencia: MIT (Open source, uso libre con atribución)


let startX, startY, endX, endY;
let selectionBox = null;
let isSelecting = false;
let selectedLinks = new Set();
let counterBox = null;

function createLinkCounter() {
  counterBox = document.createElement("div");
  Object.assign(counterBox.style, {
    position: "fixed",
    top: "8px",
    right: "8px",
    backgroundColor: "#4D2EDB",
    color: "white",
    padding: "6px 10px",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: "sans-serif",
    zIndex: 9999999,
    boxShadow: "0 0 8px rgba(0,0,0,0.2)"
  });
  counterBox.textContent = "0 enlaces seleccionados";
  document.body.appendChild(counterBox);
}

function updateLinkCounter(count) {
  if (counterBox) {
    counterBox.textContent = `${count} enlace${count === 1 ? '' : 's'} seleccionado${count === 1 ? '' : 's'}`;
  }
}

function removeLinkCounter() {
  if (counterBox) {
    counterBox.remove();
    counterBox = null;
  }
}

function createBox() {
  createLinkCounter();
  selectionBox = document.createElement("div");
  selectionBox.id = "link-selector-box";
  Object.assign(selectionBox.style, {
    position: "fixed",
    border: "2px dashed #4D2EDB",
    backgroundColor: "transparent",
    zIndex: 999999,
    pointerEvents: "none"
  });
  document.body.appendChild(selectionBox);
  document.body.style.userSelect = "none";
}

function restoreSelection() {
  removeLinkCounter();
  document.body.style.userSelect = "";
  document.querySelectorAll("a").forEach((link) => {
    link.style.textDecoration = "";
    link.style.color = "";
  });
}

function updateBox(x, y) {
  const currentX = x + window.scrollX;
  const currentY = y + window.scrollY;

  const left = Math.min(currentX, startX);
  const top = Math.min(currentY, startY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  Object.assign(selectionBox.style, {
    left: `${left - window.scrollX}px`,
    top: `${top - window.scrollY}px`,
    width: `${width}px`,
    height: `${height}px`
  });
}

function handleAutoScroll(e) {
  const margin = 30;
  const speed = 20;
  const { clientY, clientX } = e;
  const { innerHeight, innerWidth, scrollY, scrollX } = window;

  if (clientY < margin) window.scrollTo(scrollX, scrollY - speed);
  else if (clientY > innerHeight - margin) window.scrollTo(scrollX, scrollY + speed);
  if (clientX < margin) window.scrollTo(scrollX - speed, scrollY);
  else if (clientX > innerWidth - margin) window.scrollTo(scrollX + speed, scrollY);
}

document.addEventListener("mousedown", (e) => {
  if (e.button !== 2) return;
  startX = e.clientX + window.scrollX;
  startY = e.clientY + window.scrollY;
  isSelecting = true;
  selectedLinks.clear();
  createBox();
});

document.addEventListener("mousemove", (e) => {
  if (!isSelecting) return;
  handleAutoScroll(e);
  updateBox(e.clientX, e.clientY);

  const currentX = e.clientX + window.scrollX;
  const currentY = e.clientY + window.scrollY;

  const left = Math.min(currentX, startX);
  const right = Math.max(currentX, startX);
  const top = Math.min(currentY, startY);
  const bottom = Math.max(currentY, startY);

  const allLinks = document.querySelectorAll("a");
  const newSelectedLinks = new Set();

  for (let link of allLinks) {
    const rect = link.getBoundingClientRect();
    const absLeft = rect.left + window.scrollX;
    const absRight = rect.right + window.scrollX;
    const absTop = rect.top + window.scrollY;
    const absBottom = rect.bottom + window.scrollY;

    const style = window.getComputedStyle(link);
    const isVisible = style.display !== "none" && style.visibility !== "hidden";
    const isInsideArea = absLeft < right && absRight > left && absTop < bottom && absBottom > top;

    if (isInsideArea && isVisible && isTopMostElement(link, rect)) {
      link.style.textDecoration = "underline";
      link.style.color = "#4D2EDB";
      newSelectedLinks.add(link);
    } else {
      link.style.textDecoration = "";
      link.style.color = "";
    }
  }

  selectedLinks = newSelectedLinks;
  updateLinkCounter(selectedLinks.size);

function isTopMostElement(link, rect) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const topElement = document.elementFromPoint(centerX, centerY);
  return topElement === link || link.contains(topElement);
}

});

document.addEventListener("mouseup", (e) => {
  if (!isSelecting) return;
  isSelecting = false;
  endX = e.clientX + window.scrollX;
  endY = e.clientY + window.scrollY;
  if (selectionBox) selectionBox.remove();

  for (let link of selectedLinks) {
    try {
      if (typeof link.href === "string" && link.href.startsWith("http")) {
        chrome.runtime?.sendMessage({ type: "openTab", url: link.href });
      }
    } catch (err) {
      console.warn("Error al abrir enlace:", link.href, err);
    }
  }

  const left = Math.min(startX, endX);
  const right = Math.max(startX, endX);
  const top = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);

  const checkboxes = [...document.querySelectorAll("input[type='checkbox']")].filter((box) => {
    const rect = box.getBoundingClientRect();
    const absLeft = rect.left + window.scrollX;
    const absRight = rect.right + window.scrollX;
    const absTop = rect.top + window.scrollY;
    const absBottom = rect.bottom + window.scrollY;

    return absLeft < right && absRight > left && absTop < bottom && absBottom > top;
  });

  for (let cb of checkboxes) {
    cb.checked = !cb.checked;
  }

  restoreSelection();
  showOverlay();
});

function showOverlay() {
  removeLinkCounter();
}