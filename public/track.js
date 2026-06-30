(() => {
  var script = document.currentScript;
  if (!script) {
    return;
  }

  var slug = script.getAttribute("data-agent");
  if (!slug) {
    console.error("[Losono] Missing data-agent attribute on track script.");
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
    console.error("[Losono] Invalid track script src.", error);
    return;
  }

  var VISITOR_KEY = "losono_visitor_id";
  var TRAITS_KEY = "losono_traits";
  var MAX_BATCH_SIZE = 20;

  var agentId = null;
  var trackingConfig = null;
  var ready = false;
  var pendingCalls = [];
  var eventQueue = [];
  var flushTimer = null;

  function createVisitorId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getVisitorId() {
    try {
      const existing = localStorage.getItem(VISITOR_KEY);
      if (existing) {
        return existing;
      }

      const id = createVisitorId();
      localStorage.setItem(VISITOR_KEY, id);
      return id;
    } catch (_error) {
      return createVisitorId();
    }
  }

  function getTraits() {
    try {
      const raw = localStorage.getItem(TRAITS_KEY);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (_error) {
      return {};
    }
  }

  function setTraits(traits) {
    try {
      const merged = Object.assign({}, getTraits(), traits || {});
      localStorage.setItem(TRAITS_KEY, JSON.stringify(merged));
      return merged;
    } catch (_error) {
      return traits || {};
    }
  }

  function enrichProperties(properties) {
    return Object.assign({}, getTraits(), properties || {});
  }

  function whenReady(callback) {
    if (ready) {
      callback();
      return;
    }
    pendingCalls.push(callback);
  }

  function markReady() {
    ready = true;
    for (let i = 0; i < pendingCalls.length; i += 1) {
      pendingCalls[i]();
    }
    pendingCalls = [];
  }

  function parseProps(raw) {
    if (!raw) {
      return {};
    }

    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (error) {
      console.warn("[Losono] Invalid data-losono-props JSON.", error);
      return {};
    }
  }

  function buildTrackPayload(events) {
    return {
      visitorId: getVisitorId(),
      referrer: document.referrer || undefined,
      events: events,
    };
  }

  function postJson(url, body, useBeacon) {
    const payload = JSON.stringify(body);

    if (useBeacon && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      return navigator.sendBeacon(url, blob);
    }

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "omit",
    }).catch((error) => {
      console.warn("[Losono] Request failed.", error);
      return null;
    });
  }

  function sendTrackEvents(events, useBeacon) {
    if (!agentId || !events.length) {
      return;
    }

    const url = `${origin}/api/agents/${encodeURIComponent(agentId)}/track`;
    const payload = buildTrackPayload(events);
    return postJson(url, payload, useBeacon);
  }

  function flushEventQueue(useBeacon) {
    if (!eventQueue.length) {
      return;
    }

    const batches = [];
    for (let i = 0; i < eventQueue.length; i += MAX_BATCH_SIZE) {
      batches.push(eventQueue.slice(i, i + MAX_BATCH_SIZE));
    }
    eventQueue = [];

    for (let j = 0; j < batches.length; j += 1) {
      sendTrackEvents(batches[j], useBeacon);
    }
  }

  function scheduleFlush() {
    if (flushTimer) {
      return;
    }

    flushTimer = window.setTimeout(() => {
      flushTimer = null;
      flushEventQueue(false);
    }, 1000);
  }

  function queueTrackEvent(eventName, properties) {
    eventQueue.push({
      event: eventName,
      properties: enrichProperties(properties),
      pageUrl: window.location.href,
      timestamp: new Date().toISOString(),
    });

    if (eventQueue.length >= MAX_BATCH_SIZE) {
      flushEventQueue(false);
      return;
    }

    scheduleFlush();
  }

  function collectFormResponses(form) {
    const responses = {};
    const elements = form.elements;

    for (let i = 0; i < elements.length; i += 1) {
      const field = elements[i];
      if (!field.name || field.type === "submit" || field.type === "button") {
        continue;
      }

      if (field.type === "checkbox") {
        if (field.checked) {
          responses[field.name] = field.value || "on";
        }
        continue;
      }

      if (field.type === "radio") {
        if (field.checked) {
          responses[field.name] = field.value;
        }
        continue;
      }

      if (field.type === "select-multiple") {
        const selected = [];
        for (let j = 0; j < field.options.length; j += 1) {
          if (field.options[j].selected) {
            selected.push(field.options[j].value);
          }
        }
        responses[field.name] = selected.join(", ");
        continue;
      }

      responses[field.name] = field.value;
    }

    return responses;
  }

  function submitFormRequest(responses, options) {
    if (!agentId) {
      return Promise.reject(new Error("Losono agent is not ready."));
    }

    options = options || {};
    const formRef = options.formSlug || options.formId;
    const url =
      origin +
      "/api/agents/" +
      encodeURIComponent(agentId) +
      "/forms/" +
      (formRef ? `${encodeURIComponent(formRef)}/submit` : "submit");

    const body = {
      visitorId: getVisitorId(),
      responses: responses,
      pageUrl: options.pageUrl || window.location.href,
      metadata: enrichProperties(options.metadata),
    };

    if (!formRef && options.formName) {
      body.formName = options.formName;
    }

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "omit",
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          const error = new Error(
            data?.error || "Losono form submission failed.",
          );
          error.details = data;
          throw error;
        });
      }
      return response.json();
    });
  }

  function bindDeclarativeTracking() {
    document.addEventListener(
      "click",
      (event) => {
        const target = event.target;
        if (!target || typeof target.closest !== "function") {
          return;
        }

        const element = target.closest("[data-losono-track]");
        if (!element) {
          return;
        }

        const eventName = element.getAttribute("data-losono-track");
        if (!eventName) {
          return;
        }

        whenReady(() => {
          queueTrackEvent(
            eventName,
            parseProps(element.getAttribute("data-losono-props")),
          );
        });
      },
      true,
    );

    document.addEventListener(
      "submit",
      (event) => {
        const target = event.target;
        if (!target || typeof target.closest !== "function") {
          return;
        }

        const form = target.closest("form[data-losono-form]");
        if (!form) {
          return;
        }

        const dualMode =
          form.getAttribute("data-losono-form-mode") === "dual" ||
          form.hasAttribute("data-losono-form-dual");

        if (!dualMode) {
          event.preventDefault();
        }

        const formSlug = form.getAttribute("data-losono-form");
        const responses = collectFormResponses(form);

        whenReady(() => {
          submitFormRequest(responses, {
            formSlug: formSlug,
            pageUrl: window.location.href,
          })
            .then(() => {
              form.dispatchEvent(
                new Event("losono:submitted", { bubbles: true }),
              );
            })
            .catch((error) => {
              console.error("[Losono] Form submission failed.", error);
              form.dispatchEvent(
                new Event("losono:submit-error", { bubbles: true }),
              );
            });
        });
      },
      true,
    );
  }

  function bindUnloadFlush() {
    function flushOnExit() {
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }
      flushEventQueue(true);
    }

    window.addEventListener("pagehide", flushOnExit);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushOnExit();
      }
    });
  }

  const Losono = {
    track: (eventName, properties) => {
      if (!eventName || typeof eventName !== "string") {
        console.warn("[Losono] track() requires an event name.");
        return;
      }

      whenReady(() => {
        queueTrackEvent(eventName.trim(), properties);
      });
    },
    identify: (traits) => {
      if (!traits || typeof traits !== "object" || Array.isArray(traits)) {
        console.warn("[Losono] identify() requires a traits object.");
        return;
      }

      const normalized = {};
      for (const key in traits) {
        if (Object.hasOwn(traits, key)) {
          const value = traits[key];
          if (value !== undefined && value !== null) {
            normalized[key] = String(value);
          }
        }
      }

      setTraits(normalized);
    },
    submitForm: (responses, options) => {
      if (
        !responses ||
        typeof responses !== "object" ||
        Array.isArray(responses)
      ) {
        return Promise.reject(
          new Error("Losono.submitForm() requires a responses object."),
        );
      }

      const normalized = {};
      for (const key in responses) {
        if (Object.hasOwn(responses, key)) {
          normalized[key] = String(responses[key]);
        }
      }

      return new Promise((resolve, reject) => {
        whenReady(() => {
          submitFormRequest(normalized, options).then(resolve).catch(reject);
        });
      });
    },
    getVisitorId: getVisitorId,
    getConfig: () => trackingConfig,
    ready: (callback) => {
      whenReady(callback);
    },
  };

  window.Losono = Losono;

  bindDeclarativeTracking();
  bindUnloadFlush();

  fetch(`${origin}/api/public/agents/${encodeURIComponent(slug)}`, {
    method: "GET",
    credentials: "omit",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("agent_lookup_failed");
      }
      return response.json();
    })
    .then((config) => {
      agentId = config.id;
      return fetch(
        `${origin}/api/agents/${encodeURIComponent(agentId)}/track/config`,
        {
          method: "GET",
          credentials: "omit",
        },
      );
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("track_config_failed");
      }
      return response.json();
    })
    .then((config) => {
      trackingConfig = config;
      if (config.agentId) {
        agentId = config.agentId;
      }
      markReady();
    })
    .catch((error) => {
      console.error("[Losono] Failed to load agent config.", error);
    });
})();
