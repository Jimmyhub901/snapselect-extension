// Snap Select for Chrome - Background script
// Autor: Jaime Mora G.
// Versión: 1.0
// Licencia: MIT (Open source, uso libre con atribución)

// background.js

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "openTab" && message.url) {
    chrome.tabs.create({ url: message.url, active: false });
  }
});