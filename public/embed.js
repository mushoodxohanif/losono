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
  iframe.src = `${origin}/embed/${encodeURIComponent(slug)}`;
  iframe.title = "Losono agent";
  iframe.allow = "microphone";
  iframe.style.position = "fixed";
  iframe.style.bottom = "20px";
  iframe.style.width = "min(400px, calc(100vw - 2rem))";
  iframe.style.height = "min(640px, 80vh)";
  iframe.style.border = "0";
  iframe.style.borderRadius = "16px";
  iframe.style.boxShadow = "0 20px 60px rgba(0,0,0,0.25)";
  iframe.style.zIndex = "2147483646";

  if (position === "bottom-left") {
    iframe.style.left = "20px";
  } else {
    iframe.style.right = "20px";
  }

  document.body.appendChild(iframe);
})();
