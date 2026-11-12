// Page world helper of the Connectivity Profile Manager (plugins/connectivityCredentialsManager.js).
// A content script cannot reach the UI5 API of the page. Selects (Encryption, Proxy Type, ...) only change
// reliably through it: key presses move the selection but leave the hidden input and the change event behind.
// Answers { source: "cpih-conn", type: "setSelectKey", requestId, id, key } with { source: "cpih-conn-reply", requestId, ok, key }
(() => {
  if (window.__cpihConnBridge) return;
  window.__cpihConnBridge = true;

  function getControl(id) {
    const Element = window.sap?.ui?.require?.("sap/ui/core/Element");
    if (Element?.getElementById) return Element.getElementById(id);
    return window.sap?.ui?.getCore?.().byId(id);
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window || event.data?.source !== "cpih-conn" || event.data.type !== "setSelectKey") return;
    const { requestId, id, key } = event.data;
    const reply = { source: "cpih-conn-reply", requestId, ok: false };
    try {
      const control = getControl(id);
      const items = control?.getItems?.() || [];
      const item = items.find((candidate) => candidate.getKey?.() === key) || items.find((candidate) => candidate.getText?.() === key);
      if (item && control.setSelectedItem) {
        if (control.getSelectedItem() !== item) {
          control.setSelectedItem(item);
          // what a user's choice fires, the page's controller shows / hides dependent fields on it
          control.fireChange({ selectedItem: item });
        }
        reply.ok = true;
        reply.key = control.getSelectedKey();
      }
    } catch (error) {
      reply.error = String(error);
    }
    window.postMessage(reply, window.location.origin);
  });
})();
