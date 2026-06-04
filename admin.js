const adminEls = {
  form: document.querySelector("#admin-auth-form"),
  token: document.querySelector("#admin-token"),
  status: document.querySelector("#admin-status"),
  leads: document.querySelector("#admin-leads"),
  tasks: document.querySelector("#admin-tasks"),
  agents: document.querySelector("#admin-agents"),
  taskForm: document.querySelector("#admin-task-form"),
  taskStatus: document.querySelector("#admin-task-status")
};

function escapeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tokenQuery() {
  const token = adminEls.token?.value?.trim() || sessionStorage.getItem("areaIntelAdminToken") || "";
  return token ? `?token=${encodeURIComponent(token)}` : "";
}

function setStatus(message, type = "") {
  if (!adminEls.status) return;
  adminEls.status.className = `launch-status ${type}`.trim();
  adminEls.status.textContent = message;
}

async function getJson(path) {
  const response = await fetch(`${path}${tokenQuery()}`);
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Admin request failed.");
  return result;
}

function renderLeads(leads) {
  if (!adminEls.leads) return;
  adminEls.leads.innerHTML = leads.length ? leads.slice(0, 50).map((lead) => `
    <div class="admin-row">
      <strong>${escapeText(lead.name || lead.email || "New lead")}</strong>
      <span>${escapeText(lead.type || "lead")} · ${escapeText(lead.business || "No business")} · ${escapeText(lead.location || "No location")}</span>
      <small>${escapeText(lead.email || lead.phone || "No contact")} · ${lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "No timestamp"}</small>
    </div>
  `).join("") : '<p class="launch-status">No leads yet.</p>';
}

function renderTasks(tasks) {
  if (!adminEls.tasks) return;
  adminEls.tasks.innerHTML = tasks.length ? tasks.slice(0, 80).map((task) => `
    <div class="admin-row">
      <strong>${escapeText(task.title || "Internal task")}</strong>
      <span>${escapeText(task.agentId || "agent")} · ${escapeText(task.priority || "normal")} priority · ${escapeText(task.status || "open")}</span>
      <small>${escapeText(task.nextAction || "Review and take action.")}</small>
    </div>
  `).join("") : '<p class="launch-status">No agent tasks yet.</p>';
}

function renderAgents(agents) {
  if (!adminEls.agents) return;
  adminEls.agents.innerHTML = agents.length ? agents.map((agent) => `
    <article class="agent-card">
      <span>${escapeText(agent.cadence || "internal")} agent</span>
      <strong>${escapeText(agent.name)}</strong>
      <p>${escapeText(agent.goal)}</p>
      <em>${Number(agent.openTasks || 0)} open task${Number(agent.openTasks || 0) === 1 ? "" : "s"}</em>
    </article>
  `).join("") : '<p class="launch-status">No agents configured.</p>';
}

async function loadAdmin() {
  if (!tokenQuery()) {
    setStatus("Enter the admin token first.", "launch-status-error");
    return;
  }

  sessionStorage.setItem("areaIntelAdminToken", adminEls.token.value.trim());
  setStatus("Loading admin operations...");

  try {
    const [leadsResult, tasksResult, agentsResult] = await Promise.all([
      getJson("/api/admin/leads"),
      getJson("/api/admin/agent-tasks"),
      getJson("/api/admin/agents")
    ]);
    renderLeads(leadsResult.leads || []);
    renderTasks(tasksResult.tasks || []);
    renderAgents(agentsResult.agents || []);
    setStatus("Admin operations loaded.", "launch-status-ok");
  } catch (error) {
    setStatus(error.message || "Could not load admin operations.", "launch-status-error");
  }
}

function formPayload(form) {
  const data = new FormData(form);
  const payload = {};
  for (const [key, value] of data.entries()) payload[key] = String(value || "").trim();
  return payload;
}

adminEls.form?.addEventListener("submit", (event) => {
  event.preventDefault();
  loadAdmin();
});

adminEls.taskForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!tokenQuery()) {
    adminEls.taskStatus.textContent = "Enter the admin token first.";
    adminEls.taskStatus.className = "launch-status launch-status-error";
    return;
  }

  adminEls.taskStatus.textContent = "Creating task...";
  adminEls.taskStatus.className = "launch-status";

  try {
    const response = await fetch(`/api/admin/agent-tasks${tokenQuery()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formPayload(adminEls.taskForm))
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Could not create task.");
    adminEls.taskStatus.className = "launch-status launch-status-ok";
    adminEls.taskStatus.textContent = "Internal task created.";
    adminEls.taskForm.reset();
    await loadAdmin();
  } catch (error) {
    adminEls.taskStatus.className = "launch-status launch-status-error";
    adminEls.taskStatus.textContent = error.message || "Could not create task.";
  }
});

const savedToken = sessionStorage.getItem("areaIntelAdminToken");
if (savedToken && adminEls.token) {
  adminEls.token.value = savedToken;
}
