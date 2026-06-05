/* ================================================================
   AreaIntel — Public homepage interactive layer (home.js)
   ----------------------------------------------------------------
   Loaded after app.js (classic script), so it shares the global
   scope and REUSES the real AreaIntel engine rather than
   duplicating scoring or inventing standalone APIs:

     profileForZip / enrichProfileWithCensus / buildRecommendations
     decisionFor / confidenceFor / buildInstitutionalAnalysis

   Live data comes from the existing endpoints:
     GET  /api/area-report?zip=         (census profile)
     GET  /api/business-count?zip=&...  (real competition + demand + map records)
     GET  /api/geocode?address=         (address -> [lng,lat])

   The live map + demo verdict card use this real engine. No sample
   numbers are shown when the engine returns data; foot-traffic
   figures are explicitly labelled "modeled", consistent with the
   rest of the product.
   ================================================================ */
(function () {
  "use strict";

  const homeMapEl = document.getElementById("home-map");
  const bizGridEl = document.getElementById("bizGrid");
  const analyzeBtn = document.getElementById("analyzeBtn");
  // Only run on the public landing.
  if (!homeMapEl || !bizGridEl || !analyzeBtn) return;

  const CONFIG = {
    MAP_STYLE: "https://tiles.openfreemap.org/styles/dark",
    DEFAULT_CENTER: [-73.9905, 40.7488], // ~ ZIP 10001
    DEFAULT_ZOOM: 13,
    RADIUS_METERS: 800
  };

  // Demo categories -> the engine's category-model business ids.
  const BIZ = [
    { id: "coffee", label: "Coffee Shop", cat: "cafe", noun: "coffee shop", search: "coffee shop" },
    { id: "gym", label: "Fitness Gym", cat: "gym", noun: "gym", search: "gym" },
    { id: "pizza", label: "Pizza Place", cat: "pizza", noun: "pizza place", search: "pizza" },
    { id: "salon", label: "Hair Salon", cat: "salon", noun: "salon", search: "hair salon" }
  ];
  const bizById = (id) => BIZ.find((b) => b.id === id) || BIZ[0];

  // Centroids so the map can fly to common demo ZIPs (cosmetic only;
  // the engine itself works off the ZIP regardless).
  const ZIP_CENTROIDS = {
    "10001": { c: [-73.9967, 40.7506], city: "Manhattan, NY" },
    "10003": { c: [-73.9890, 40.7320], city: "Manhattan, NY" },
    "10011": { c: [-74.0008, 40.7420], city: "Manhattan, NY" },
    "11201": { c: [-73.9903, 40.6939], city: "Brooklyn, NY" },
    "11211": { c: [-73.9571, 40.7128], city: "Brooklyn, NY" }
  };
  const NYC_DEFAULT = { c: CONFIG.DEFAULT_CENTER, city: "New York, NY" };

  /* ---------------- map ---------------- */
  let map = null;
  let pinMarker = null;
  let layer = "foot";
  let mapBiz = "all";
  let mapCenter = CONFIG.DEFAULT_CENTER.slice();
  let lastPoint = null; // populated by the real analysis

  function circleGeo(center, radiusM) {
    const pts = 64;
    const coords = [];
    const [lng, lat] = center;
    const dx = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
    const dy = radiusM / 110540;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * 2 * Math.PI;
      coords.push([lng + dx * Math.cos(a), lat + dy * Math.sin(a)]);
    }
    return { type: "Feature", geometry: { type: "Polygon", coordinates: [coords] } };
  }

  function initMap() {
    if (!window.maplibregl) {
      const t = document.getElementById("readoutTxt");
      if (t) t.textContent = "Map library failed to load";
      return;
    }
    map = new maplibregl.Map({
      container: "home-map",
      style: CONFIG.MAP_STYLE,
      center: CONFIG.DEFAULT_CENTER,
      zoom: CONFIG.DEFAULT_ZOOM,
      attributionControl: true
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.addSource("radius", { type: "geojson", data: circleGeo(mapCenter, CONFIG.RADIUS_METERS) });
      map.addLayer({ id: "radius-fill", type: "fill", source: "radius", paint: { "fill-color": "#06B6D4", "fill-opacity": 0.06 } });
      map.addLayer({
        id: "radius-line", type: "line", source: "radius",
        paint: { "line-color": "#06B6D4", "line-width": 1, "line-dasharray": [2, 2], "line-opacity": 0.5 }
      });
      map.addSource("competitors", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "comp-pts", type: "circle", source: "competitors",
        paint: {
          "circle-radius": 5,
          "circle-color": ["case", ["get", "inRadius"], "#EF4444", "#64748B"],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": ["case", ["get", "inRadius"], "#EF4444", "#475569"]
        }
      });
      const el = document.createElement("div");
      el.style.cssText = "width:14px;height:14px;border-radius:50%;background:#06B6D4;box-shadow:0 0 0 4px rgba(6,182,212,.25)";
      pinMarker = new maplibregl.Marker({ element: el }).setLngLat(mapCenter).addTo(map);
    });

    map.on("click", (e) => movesPin([e.lngLat.lng, e.lngLat.lat]));
  }

  function movesPin(lngLat) {
    mapCenter = lngLat;
    if (pinMarker) pinMarker.setLngLat(lngLat);
    if (map && map.getSource("radius")) map.getSource("radius").setData(circleGeo(lngLat, CONFIG.RADIUS_METERS));
  }

  function flyTo(center, zoom) {
    if (!map) return;
    map.flyTo({ center, zoom });
    movesPin(center);
  }

  function plotCompetitors() {
    if (!map || !map.getSource("competitors")) return;
    const comps = (lastPoint && lastPoint.competitors) || [];
    const feats = comps
      .filter((c) => mapBiz === "all" || c.business === mapBiz)
      .map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        properties: { inRadius: !!c.inRadius }
      }));
    map.getSource("competitors").setData({ type: "FeatureCollection", features: feats });
  }

  function updateReadout() {
    const r = document.getElementById("readout");
    const t = document.getElementById("readoutTxt");
    if (!r || !t) return;
    const ic = r.querySelector("i");
    if (!lastPoint) {
      if (ic) ic.className = "ti ti-click";
      t.textContent = "Run an analysis below for live foot traffic, competition & demand";
      return;
    }
    const d = lastPoint;
    if (layer === "foot") {
      if (ic) ic.className = "ti ti-walk";
      t.textContent = `Peak footfall ~${d.footfall.toLocaleString()}/day (modeled) · top ${d.footPct}%`;
    } else if (layer === "comp") {
      if (ic) ic.className = "ti ti-building-store";
      const n = d.competitors.filter((c) => (mapBiz === "all" || c.business === mapBiz) && c.inRadius).length;
      const lbl = mapBiz === "all" ? "competitor" : bizById(mapBiz).noun;
      t.textContent = `${n} ${lbl}${n === 1 ? "" : "s"} within ${(CONFIG.RADIUS_METERS / 1609).toFixed(1)} mi`;
    } else {
      if (ic) ic.className = "ti ti-trending-up";
      t.textContent = `Unmet demand index ${d.demand}/100`;
    }
  }

  // Layer + competitor-filter toggles operate on the real analysis result.
  document.querySelectorAll(".lbtn").forEach((b) =>
    (b.onclick = () => {
      layer = b.dataset.layer;
      document.querySelectorAll(".lbtn").forEach((x) => x.classList.toggle("on", x === b));
      updateReadout();
    })
  );
  document.querySelectorAll(".cgroup .bchip").forEach((b) =>
    (b.onclick = () => {
      mapBiz = b.dataset.b;
      document.querySelectorAll(".cgroup .bchip").forEach((x) => x.classList.toggle("on", x === b));
      layer = "comp";
      document.querySelectorAll(".lbtn").forEach((x) => x.classList.toggle("on", x.dataset.layer === "comp"));
      plotCompetitors();
      updateReadout();
    })
  );

  /* ---------------- demo panel ---------------- */
  let selBiz = "coffee";
  let mode = "area";
  let selZip = "10001";

  function buildBiz() {
    bizGridEl.innerHTML = BIZ.map(
      (b) => `<div class="chip${b.id === selBiz ? " sel" : ""}" data-biz="${b.id}">${b.label}</div>`
    ).join("");
    bizGridEl.querySelectorAll(".chip").forEach((el) => (el.onclick = () => { selBiz = el.dataset.biz; buildBiz(); }));
  }

  function buildLoc() {
    const w = document.getElementById("locWrap");
    if (!w) return;
    if (mode === "area") {
      w.innerHTML = `<span class="aLbl">ZIP code</span><input class="field" id="zipInput" value="${selZip}" placeholder="Enter a NYC ZIP code" inputmode="numeric" />`;
      analyzeBtn.innerHTML = "Analyze Area &#8594;";
    } else {
      w.innerHTML = `<span class="aLbl">Street address</span><input class="field" id="addrInput" value="350 5th Ave, New York, NY" placeholder="123 Main St, Brooklyn, NY" autocomplete="street-address" />`;
      analyzeBtn.innerHTML = "Analyze Block &#8594;";
    }
  }

  document.querySelectorAll("#segCtl button").forEach((b) =>
    (b.onclick = () => {
      mode = b.dataset.mode;
      document.querySelectorAll("#segCtl button").forEach((x) => x.classList.toggle("on", x === b));
      buildLoc();
    })
  );

  /* ---- helpers that wrap the real engine ---- */

  async function fetchJson(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    return res.json();
  }

  // Resolve a ZIP (area) or address (block) to {zip, center, label}.
  async function resolveLocation(value) {
    if (mode === "area") {
      const zip = (value.match(/\b\d{5}\b/) || [value])[0];
      const hit = ZIP_CENTROIDS[zip] || NYC_DEFAULT;
      return { zip, center: hit.c, label: `ZIP ${zip} · ${hit.city}`, scope: `AREA · ZIP ${zip}`, isArea: true };
    }
    // block: geocode the address with the real geocoder
    let center = NYC_DEFAULT.c;
    let zip = "10001";
    try {
      const g = await fetchJson(`/api/geocode?address=${encodeURIComponent(value)}`);
      if (Array.isArray(g.center)) center = g.center;
      else if (typeof g.lng === "number" && typeof g.lat === "number") center = [g.lng, g.lat];
      const z = (g.zip || g.label || value).toString().match(/\b\d{5}\b/);
      if (z) zip = z[0];
    } catch (err) {
      console.warn("[home] geocode failed, using ZIP from address", err);
      const z = value.match(/\b\d{5}\b/);
      if (z) zip = z[0];
    }
    return { zip, center, label: value, scope: `BLOCK · ${value}`, isArea: false };
  }

  function rentLabel(profile) {
    const r = safeNumber(profile && profile.rent, 50);
    if (r >= 80) return "VERY HIGH";
    if (r >= 65) return "HIGH";
    if (r >= 45) return "MODERATE";
    return "LOW";
  }

  function verdictFor(score) {
    if (score >= 80) return { label: "VIABLE", color: "#10B981" };
    if (score >= 68) return { label: "MODERATE", color: "#F59E0B" };
    return { label: "HIGH RISK", color: "#EF4444" };
  }

  function competitorsFromResult(businessResult, center, biz, isArea) {
    const records = (businessResult && businessResult.mapRecords) || [];
    const [clng, clat] = center;
    return records
      .filter((rec) => Number.isFinite(rec.lat) && Number.isFinite(rec.lng))
      .slice(0, 60)
      .map((rec) => {
        const dx = (rec.lng - clng) * 111320 * Math.cos((clat * Math.PI) / 180);
        const dy = (rec.lat - clat) * 110540;
        const distM = Math.hypot(dx, dy);
        // Block search is already radius-filtered server-side; area markers
        // are flagged in-radius by distance to the centroid.
        return { lng: rec.lng, lat: rec.lat, business: biz.id, inRadius: isArea ? distM <= CONFIG.RADIUS_METERS : true };
      });
  }

  function renderResult(r) {
    const v = r.verdict;
    document.getElementById("resultPanel").innerHTML = `
      <div class="rev scopepill"><i class="ti ${r.isArea ? "ti-map-2" : "ti-map-pin"}"></i>${r.scope}</div>
      <div class="rev scorebadge" style="background:${v.color}14;border:1px solid ${v.color}55">
        <span style="width:8px;height:8px;border-radius:50%;background:${v.color}"></span>
        <span style="font-size:12px;font-weight:600;color:${v.color}">${v.label}</span>
        <span style="font-size:26px;font-weight:700;color:${v.color}">${r.score}</span>
        <span style="font-size:13px;color:${v.color}88">/100</span>
        <span style="font-size:10px;color:#334155;margin-left:auto">${r.confidence}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px">
        <div class="rev icard" style="border-top:2px solid #10B981;animation-delay:.1s"><h4 style="color:#10B981">Why it works</h4><p>${r.why}</p></div>
        <div class="rev icard" style="border-top:2px solid #F59E0B;animation-delay:.18s"><h4 style="color:#F59E0B">Risk factors</h4><p>${r.risk}</p></div>
        <div class="rev icard" style="border-top:2px solid #06B6D4;animation-delay:.26s"><h4 style="color:#06B6D4">Next action</h4><p>${r.action}</p></div>
      </div>
      <p class="rev" style="text-align:right;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#1E3A5F;margin-top:10px;animation-delay:.34s">Powered by the live AreaIntel decision engine</p>`;
  }

  function renderError(msg) {
    document.getElementById("resultPanel").innerHTML = `
      <div class="ph"><i class="ti ti-alert-triangle" style="font-size:26px;color:#F59E0B;margin-bottom:10px"></i>
      <p style="color:#94A3B8">${msg}</p>
      <p style="font-size:11px;max-width:240px;margin-top:6px">Try a NYC ZIP (e.g. 10001) or a full street address, or use “Start Free Analysis” for the full report.</p></div>`;
  }

  async function runAnalysis() {
    const panel = document.getElementById("resultPanel");
    const value =
      mode === "area"
        ? ((document.getElementById("zipInput") || {}).value || selZip).trim()
        : ((document.getElementById("addrInput") || {}).value || "").trim();

    if (mode === "area" && !/\b\d{5}\b/.test(value)) {
      renderError("Enter a five-digit NYC ZIP code to run the area analysis.");
      return;
    }
    if (mode === "block" && value.length < 6) {
      renderError("Enter a full street address to run the block analysis.");
      return;
    }

    panel.innerHTML = `<div class="ph"><div class="spin"></div><p style="color:#94A3B8;font-weight:500">${
      mode === "area" ? "Analyzing area…" : "Analyzing block…"
    }</p><p style="font-size:11px;max-width:240px;margin-top:4px">${
      mode === "area"
        ? "Scanning the ZIP — demographics, competition, demand momentum"
        : "Scanning this block — neighbors, demand, local fit"
    }</p></div>`;

    const biz = bizById(selBiz);
    let loc;
    try {
      loc = await resolveLocation(value);
    } catch (err) {
      console.warn("[home] resolveLocation failed", err);
      renderError("Could not resolve that location.");
      return;
    }
    if (mode === "area") selZip = loc.zip;
    flyTo(loc.center, mode === "area" ? 12.5 : 15.5);

    // ---- REAL ENGINE (shared with the full report) ----
    try {
      // 1) live census -> enriched profile
      const base = state.liveProfiles[loc.zip] || (typeof zipProfiles !== "undefined" && zipProfiles[loc.zip]) || profileForZip(loc.zip);
      let profile = base;
      try {
        const area = await fetchJson(`/api/area-report?zip=${encodeURIComponent(loc.zip)}`);
        if (area && area.census) {
          profile = enrichProfileWithCensus(base, area.census);
          state.liveProfiles[loc.zip] = profile;
        }
      } catch (err) {
        console.warn("[home] area-report unavailable, using modeled profile", err);
      }

      // 2) live competition + demand
      let businessResult = null;
      try {
        const params = new URLSearchParams({ zip: loc.zip, business: biz.search });
        if (mode === "block") {
          params.set("lat", String(loc.center[1]));
          params.set("lng", String(loc.center[0]));
          params.set("radius", "0.5");
          params.set("address", value);
        }
        businessResult = await fetchJson(`/api/business-count?${params.toString()}`);
        state.lastBusinessResult = businessResult;
      } catch (err) {
        console.warn("[home] business-count unavailable", err);
      }

      // 3) reuse the real engine to score + decide
      state.zip = loc.zip;
      state.business = biz.cat;
      const recommendations = buildRecommendations(profile);
      const rec = recommendations.find((x) => x.business === biz.cat) || recommendations[0];
      const score = clampScore(rec.score);
      const decision = decisionFor(profile, recommendations, businessResult);
      const confidence = confidenceFor(loc.zip, businessResult);
      const verdict = verdictFor(score);

      const compCount = businessResult ? safeNumber(businessResult.count, 0) : 0;
      const saturation = saturationLabel(saturationFromCount(compCount, profile));
      let demandSentence = "";
      try { demandSentence = demandMomentumLabel(businessResult); } catch (e) { demandSentence = ""; }
      // Only surface demand momentum when it is actually available.
      if (/unavailable/i.test(demandSentence)) demandSentence = "";

      const scopeWord = loc.isArea ? "across the ZIP" : "within 0.5 mi";
      const why = `${biz.label} scores ${score}/100 here — ${decision.copy}`;
      const risk = `${compCount} competing ${biz.noun}${compCount === 1 ? "" : "s"} ${scopeWord}. Competitive pressure: ${saturation}. Rent pressure: ${rentLabel(profile)}.${demandSentence ? ` Demand momentum: ${demandSentence}.` : ""}`;
      const action = `${decision.next}. ${decision.nextCopy}`;

      renderResult({
        score,
        verdict,
        confidence: `${String(confidence.label || "").toUpperCase()} CONFIDENCE`.trim(),
        scope: loc.scope,
        isArea: loc.isArea,
        why,
        risk,
        action
      });

      // ---- feed the live map with the same real result ----
      // Footfall is a modeled estimate (the product never claims exact counts).
      const officeLift = safeNumber(profile.office, 50) >= 75 ? 1.18 : 1;
      const footfall = Math.round((600 + score * 110) * officeLift);
      let demandIdx = clampScore(rec.score);
      try { demandIdx = clampScore(demandMomentumScore(businessResult)); } catch (e) { /* keep score-based */ }
      lastPoint = {
        footfall,
        footPct: Math.max(1, Math.min(99, Math.round(score * 0.55 + 8))),
        demand: demandIdx,
        competitors: competitorsFromResult(businessResult, loc.center, biz, loc.isArea)
      };
      // sync the map competitor filter to the analyzed business
      mapBiz = biz.id;
      document.querySelectorAll(".cgroup .bchip").forEach((x) => x.classList.toggle("on", x.dataset.b === biz.id || (x.dataset.b === "all" && false)));
      plotCompetitors();
      updateReadout();
      const locLabelEl = document.getElementById("mapLocLabel");
      if (locLabelEl) locLabelEl.textContent = `${loc.label} · live`;
    } catch (err) {
      console.error("[home] analysis failed", err);
      renderError("The analysis engine hit an error. Please try again.");
    }
  }

  analyzeBtn.onclick = runAnalysis;

  /* ---------------- boot ---------------- */
  buildBiz();
  buildLoc();
  initMap();
  updateReadout();
})();
