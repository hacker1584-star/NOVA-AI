(function () {
  "use strict";

  async function loadConfig() {
    try {
      const response = await fetch("/api/config", { cache: "no-store" });

      if (!response.ok) {
        throw new Error("Config endpoint unavailable.");
      }

      const config = await response.json();
      window.__NOVA_CONFIG__ = config || {};
      return config;
    } catch (error) {
      console.warn("NOVA final-stage config check failed:", error);
      window.__NOVA_CONFIG__ = {};
      return {};
    }
  }

  function computeReadinessSummary() {
    const guard = window.NOVA_PRODUCTION_GUARD;

    if (guard && typeof guard.assertProductionReady === "function") {
      const result = guard.assertProductionReady();
      return {
        ok: result.passes,
        result
      };
    }

    return {
      ok: true,
      result: { checks: [], passes: true, failed: [] }
    };
  }

  async function init() {
    await loadConfig();

    const readiness = computeReadinessSummary();
    window.NOVA_READY = readiness.ok;
    window.NOVA_READINESS = readiness.result;

    if (typeof window.NOVA !== "undefined") {
      window.NOVA.productionCheck = () => computeReadinessSummary();
    }

    if (typeof console !== "undefined") {
      console.info("NOVA final-stage readiness:", readiness);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
