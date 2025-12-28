const LS_KEY = "brandai_workspace_v1";

const $ = (id) => document.getElementById(id);

const state = {
  theme: "light",
  brand: {
    name: "",
    oneLiner: "",
    audience: "",
    tones: ["溫暖", "專業", "直接", "有梗"]
  },
  role: {
    name: "品牌總編輯",
    level: "senior",
    keywords: "溫暖、直接、專業"
  },
  scene: {
    type: "social",
    goal: "引導私訊",
    constraints: "200字內、避免太像廣告、要有具體好處"
  },
  knowledge: {
    points: ""
  },
  outputs: {
    activeTab: "版本A",
    items: []
  },
  history: []
};

const toneOptions = ["溫暖", "專業", "直接", "文青", "熱血", "極簡", "幽默", "高級感"];

function save() {
  localStorage.setItem(LS_KEY, JSON.stringify(state));
  setStatus("已自動保存");
}

function load() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    Object.assign(state, data);
  } catch {
    // ignore
  }
}

function setStatus(text) {
  $("statusText").textContent = text;
  clearTimeout(setStatus._t);
  setStatus._t = setTimeout(() => {
    $("statusText").textContent = "已自動保存";
  }, 1200);
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme === "dark" ? "dark" : "light");
}

function bindInputs() {
  // Brand
  $("brandName").value = state.brand.name || "";
  $("brandOneLiner").value = state.brand.oneLiner || "";
  $("brandAudience").value = state.brand.audience || "";
  $("kbPoints").value = state.knowledge.points || "";

  // Role
  $("roleName").value = state.role.name || "";
  $("roleLevel").value = state.role.level || "senior";
  $("roleKeywords").value = state.role.keywords || "";

  // Scene
  $("sceneType").value = state.scene.type || "social";
  $("sceneGoal").value = state.scene.goal || "";
  $("sceneConstraints").value = state.scene.constraints || "";

  // listeners
  $("brandName").addEventListener("input", (e) => { state.brand.name = e.target.value; save(); });
  $("brandOneLiner").addEventListener("input", (e) => { state.brand.oneLiner = e.target.value; save(); });
  $("brandAudience").addEventListener("input", (e) => { state.brand.audience = e.target.value; save(); });

  $("roleName").addEventListener("input", (e) => { state.role.name = e.target.value; save(); });
  $("roleLevel").addEventListener("change", (e) => { state.role.level = e.target.value; save(); });
  $("roleKeywords").addEventListener("input", (e) => { state.role.keywords = e.target.value; save(); });

  $("sceneType").addEventListener("change", (e) => { state.scene.type = e.target.value; save(); });
  $("sceneGoal").addEventListener("input", (e) => { state.scene.goal = e.target.value; save(); });
  $("sceneConstraints").addEventListener("input", (e) => { state.scene.constraints = e.target.value; save(); });

  $("kbPoints").addEventListener("input", (e) => { state.knowledge.points = e.target.value; save(); });
}

function renderToneChips() {
  const el = $("toneChips");
  el.innerHTML = "";
  toneOptions.forEach((t) => {
    const chip = document.createElement("button");
    chip.className = "chip" + (state.brand.tones.includes(t) ? " active" : "");
    chip.type = "button";
    chip.textContent = t;
    chip.addEventListener("click", () => {
      if (state.brand.tones.includes(t)) {
        state.brand.tones = state.brand.tones.filter(x => x !== t);
      } else {
        state.brand.tones = [...state.brand.tones, t];
      }
      renderToneChips();
      save();
    });
    el.appendChild(chip);
  });
}

function renderTabs() {
  const tabs = $("outputTabs");
  tabs.innerHTML = "";
  const names = state.outputs.items.map(x => x.title);
  if (names.length === 0) return;

  names.forEach((name) => {
    const btn = document.createElement("button");
    btn.className = "tab" + (state.outputs.activeTab === name ? " active" : "");
    btn.textContent = name;
    btn.type = "button";
    btn.addEventListener("click", () => {
      state.outputs.activeTab = name;
      renderOutput();
      save();
    });
    tabs.appendChild(btn);
  });
}

function renderOutput() {
  const area = $("outputArea");
  if (!state.outputs.items.length) {
    area.innerHTML = `
      <div class="emptyState">
        <div class="emptyTitle">還沒有生成結果</div>
        <div class="emptySub">填完左邊四塊，按「生成 3 種版本」。</div>
      </div>
    `;
    $("outputTabs").innerHTML = "";
    return;
  }

  renderTabs();
  const active = state.outputs.items.find(x => x.title === state.outputs.activeTab) || state.outputs.items[0];

  area.innerHTML = `
    <div class="outBlock">
      <div class="outTitle">${escapeHtml(active.title)}</div>
      <div class="outText">${escapeHtml(active.text)}</div>
    </div>
    <div class="outBlock">
      <div class="outTitle">一鍵複製（目前版本）</div>
      <div class="row" style="margin-top:10px">
        <button class="btn" id="btnCopyOne">複製這一版</button>
      </div>
    </div>
  `;

  const btnCopyOne = document.getElementById("btnCopyOne");
  btnCopyOne.addEventListener("click", async () => {
    await copyToClipboard(active.text);
    setStatus("已複製（目前版本）");
  });
}

function renderHistory() {
  const list = $("historyList");
  list.innerHTML = "";

  if (!state.history.length) {
    list.innerHTML = `<div style="padding:10px;color:var(--muted);font-weight:700;font-size:12px">還沒有紀錄</div>`;
    return;
  }

  state.history.slice(0, 18).forEach((h) => {
    const div = document.createElement("div");
    div.className = "hItem";
    div.innerHTML = `
      <div class="hTitle">${escapeHtml(h.title)}</div>
      <div class="hMeta">${escapeHtml(h.meta)}</div>
    `;
    div.addEventListener("click", () => {
      // 載入快照
      Object.assign(state, h.snapshot);
      applyTheme();
      bindInputs();
      renderToneChips();
      renderOutput();
      renderHistory();
      setStatus("已載入歷史草稿");
      save();
    });
    list.appendChild(div);
  });
}

function buildMeta() {
  const typeMap = {
    social: "社群貼文",
    landing: "招生頁",
    seo: "SEO",
    email: "Email"
  };
  const t = typeMap[state.scene.type] || state.scene.type;
  const brand = state.brand.name || "未命名品牌";
  const tones = (state.brand.tones || []).slice(0, 3).join(" / ") || "—";
  return `${brand} · ${t} · ${tones}`;
}

function generateDemoCopy() {
  const brand = state.brand.name?.trim() || "（你的品牌）";
  const one = state.brand.oneLiner?.trim() || "（品牌定位）";
  const ta = state.brand.audience?.trim() || "（目標受眾）";
  const tones = (state.brand.tones || []).join("、") || "專業";
  const role = state.role.name?.trim() || "（角色）";
  const roleLevel = state.role.level;
  const roleKw = state.role.keywords?.trim() || "";
  const sceneType = state.scene.type;
  const goal = state.scene.goal?.trim() || "（你的 CTA）";
  const constraints = state.scene.constraints?.trim() || "";
  const points = (state.knowledge.points || "").trim();

  const bullets = points
    ? points.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 6)
    : ["（請在左側貼上 key points，越具體越好）"];

  const openerByScene = {
    social: `你以為你卡的是「方法」？其實多半卡在「順序」。`,
    landing:`先講清楚你會得到什麼，再談你要付出什麼。`,
    seo:    `把「想搜尋的人」講的那句話，直接放進標題。`,
    email:  `這封信不賣焦慮，只給你一個更簡單的路徑。`
  };

  const vibe = roleLevel === "senior" ? "（老練、短句、有判斷）"
             : roleLevel === "mid" ? "（務實、結構清楚）"
             : "（親切、一步一步帶）";

  const A =
`${openerByScene[sceneType] || "我們把事情說清楚。"}
【${brand}】${one}

給 ${ta} 的重點只有三個：
1) ${bullets[0] || "—"}
2) ${bullets[1] || "—"}
3) ${bullets[2] || "—"}

如果你要的是「${goal}」：
→ 我建議你先從這一步開始：${bullets[3] || "（填寫/私訊/點連結）"}

${constraints ? `（限制：${constraints}）` : ""}

— ${role} ${vibe}`;

  const B =
`有些問題不是你不夠努力，
而是你一直用「不適合你的解法」在硬撐。

【${brand}】想做的事很簡單：${one}
寫給 ${ta} 的你——

我把這次的方向整理成一張小卡：
- ${bullets[0] || "—"}
- ${bullets[1] || "—"}
- ${bullets[2] || "—"}
- ${bullets[3] || "—"}

如果你願意，下一步就做這件事：${goal}
（${tones}；${roleKw || "口吻一致"}）
${constraints ? `*備註：${constraints}*` : ""}`;

  const C =
`【${brand}｜${ta} 專用】
你不需要更多資訊，你需要「正確的下一步」。

✅ 你會得到：
- ${bullets[0] || "—"}
- ${bullets[1] || "—"}
- ${bullets[2] || "—"}

✅ 你只要做：
- ${bullets[3] || "—"}
- ${bullets[4] || "—"}

現在就 ${goal}
（${constraints || "可簡短回覆：我想開始"}）`;

  return [
    { title: "版本A", text: A },
    { title: "版本B", text: B },
    { title: "版本C", text: C },
  ];
}

function pushHistory() {
  const title = `${state.brand.name || "未命名品牌"} · ${new Date().toLocaleString()}`;
  const meta = buildMeta();
  const snapshot = JSON.parse(JSON.stringify(state));
  state.history = [{ ts: Date.now(), title, meta, snapshot }, ...state.history].slice(0, 40);
}

function newDraft() {
  state.brand.name = "";
  state.brand.oneLiner = "";
  state.brand.audience = "";
  state.brand.tones = ["溫暖", "專業", "文青"];
  state.role.name = "品牌總編輯";
  state.role.level = "senior";
  state.role.keywords = "溫暖、直接、專業";
  state.scene.type = "social";
  state.scene.goal = "引導私訊";
  state.scene.constraints = "200字內、避免太像廣告、要有具體好處";
  state.knowledge.points = "";
  state.outputs.items = [];
  state.outputs.activeTab = "版本A";
  save();
  bindInputs();
  renderToneChips();
  renderOutput();
  setStatus("已新建草稿");
}

function clearAll() {
  if (!confirm("確定要清空目前草稿？")) return;
  newDraft();
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function exportJSON() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `brandai-workspace-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  setStatus("已匯出 JSON");
}

function importJSONFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      Object.assign(state, data);
      applyTheme();
      bindInputs();
      renderToneChips();
      renderOutput();
      renderHistory();
      save();
      setStatus("已匯入 JSON");
    } catch {
      alert("JSON 格式錯誤，匯入失敗");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function initNavDemo() {
  document.querySelectorAll(".sbItem").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      document.querySelectorAll(".sbItem").forEach(x=>x.classList.remove("active"));
      btn.classList.add("active");
      setStatus("（Demo）這裡之後可做多頁");
    });
  });
}

function init() {
  load();
  applyTheme();

  bindInputs();
  renderToneChips();
  renderOutput();
  renderHistory();
  initNavDemo();

  $("btnTheme").addEventListener("click", () => {
    state.theme = (state.theme === "dark") ? "light" : "dark";
    applyTheme();
    save();
  });

  $("btnNew").addEventListener("click", newDraft);
  $("btnClear").addEventListener("click", clearAll);

  $("btnGenerate").addEventListener("click", async () => {
    setStatus("生成中…");
    const outs = generateDemoCopy();
    state.outputs.items = outs;
    state.outputs.activeTab = outs[0]?.title || "版本A";

    pushHistory();
    renderHistory();
    renderOutput();
    save();
    setStatus("已生成（Demo）");
  });

  $("btnCopyAll").addEventListener("click", async () => {
    if (!state.outputs.items.length) return;
    const all = state.outputs.items.map(x => `【${x.title}】\n${x.text}`).join("\n\n---\n\n");
    await copyToClipboard(all);
    setStatus("已複製（全部版本）");
  });

  $("btnExport").addEventListener("click", exportJSON);
  $("btnImport").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) importJSONFile(file);
    e.target.value = "";
  });
}

init();
