"use client";

import { useEffect } from "react";

export function EmbedChromeFix() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    html.dataset.embed = "true";
    html.style.setProperty("background", "transparent", "important");
    html.style.setProperty("background-color", "transparent", "important");
    html.style.setProperty("color-scheme", "normal", "important");
    body.style.setProperty("background", "transparent", "important");
    body.style.setProperty("background-color", "transparent", "important");
    body.style.setProperty("min-height", "0", "important");
    body.style.setProperty("overflow", "hidden", "important");

    return () => {
      delete html.dataset.embed;
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      html.style.removeProperty("color-scheme");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      body.style.removeProperty("min-height");
      body.style.removeProperty("overflow");
    };
  }, []);

  return null;
}
