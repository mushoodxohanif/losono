(() => {
  var script = document.currentScript;
  if (!script) {
    return;
  }

  var slug = script.getAttribute("data-agent");
  if (!slug) {
    console.error("[Losono] Missing data-agent attribute on embed script.");
    return;
  }

  var src = script.getAttribute("src");
  if (!src) {
    return;
  }

  var origin;
  try {
    origin = new URL(src, window.location.href).origin;
  } catch (error) {
    console.error("[Losono] Invalid embed script src.", error);
    return;
  }

  var position = script.getAttribute("data-position") || "bottom-right";

  var iframe = document.createElement("iframe");
  iframe.src = `${origin}/embed/${encodeURIComponent(slug)}?position=${encodeURIComponent(position)}`;
  iframe.title = "Losono agent";
  iframe.allow = "microphone";
  iframe.setAttribute("allowtransparency", "true");
  iframe.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;border:0;background:transparent;background-color:transparent;color-scheme:normal;pointer-events:none;z-index:2147483646;";

  var overlay = null;
  var isOpen = false;

  function setOpen(open) {
    if (open === isOpen) {
      return;
    }
    isOpen = open;

    if (open) {
      overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:2147483645;background:transparent;opacity:0;transition:opacity 300ms ease;";
      overlay.addEventListener("click", () => {
        iframe.contentWindow.postMessage(
          { type: "losono:embed:close" },
          origin,
        );
      });
      document.body.appendChild(overlay);
      requestAnimationFrame(() => {
        if (overlay) {
          overlay.style.opacity = "1";
        }
      });
    } else if (overlay) {
      overlay.style.opacity = "0";
      setTimeout(
        (node) => {
          node.remove();
        },
        300,
        overlay,
      );
      overlay = null;
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== iframe.contentWindow) {
      return;
    }
    if (event.data && event.data.type === "losono:embed:resize") {
      setOpen(!!event.data.open);
    }
  });

  document.body.appendChild(iframe);
})();
