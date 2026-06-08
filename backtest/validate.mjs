// Minimal validation framework: store SpotVest predictions and compare them to
// real-world outcomes later. Numbers are recorded as-given (deterministic).
//   node backtest/validate.mjs add '{"business":"Italian restaurant","zip":"10009","spotvestScore":61,"confidenceScore":91,"decision":"CONDITIONAL","outcomeStatus":"unknown"}'
//   node backtest/validate.mjs list
//   node backtest/validate.mjs report   # accuracy summary once outcomes are known
import fs from "node:fs";
const FILE = new URL("./validation-records.json", import.meta.url);
const db = JSON.parse(fs.readFileSync(FILE, "utf8"));
const [cmd, payload] = [process.argv[2], process.argv[3]];
function save() { fs.writeFileSync(FILE, JSON.stringify(db, null, 2)); }
if (cmd === "add") {
  const rec = JSON.parse(payload);
  rec.predictedAt = rec.predictedAt || new Date().toISOString().slice(0, 10);
  rec.outcomeStatus = rec.outcomeStatus || "unknown";
  db.records.push(rec); save();
  console.log(`added (${db.records.length} total):`, rec);
} else if (cmd === "report") {
  const known = db.records.filter((r) => r.outcomeStatus === "open" || r.outcomeStatus === "closed");
  console.log(`records: ${db.records.length} · with known outcome: ${known.length}`);
  if (known.length) {
    const band = (s) => s >= 70 ? "70+" : s >= 40 ? "40-69" : "<40";
    const groups = {};
    known.forEach((r) => { const b = band(r.spotvestScore); (groups[b] = groups[b] || []).push(r); });
    for (const b of ["70+", "40-69", "<40"]) {
      const g = groups[b] || [];
      const openRate = g.length ? (100 * g.filter((r) => r.outcomeStatus === "open").length / g.length).toFixed(0) + "%" : "-";
      console.log(`  ${b.padEnd(6)} n=${String(g.length).padStart(3)}  still-open=${openRate}`);
    }
  } else {
    console.log("  (no known outcomes yet — fill outcomeStatus to enable accuracy comparison)");
  }
} else {
  console.log(`records: ${db.records.length}`);
  db.records.forEach((r, i) => console.log(`  ${i + 1}. ${r.business} @ ${r.zip} → score ${r.spotvestScore} / ${r.decision} · outcome ${r.outcomeStatus}`));
}
