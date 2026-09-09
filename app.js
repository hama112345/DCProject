
(() => {
  "use strict";

  const STORAGE_KEY = "dc-dashboard-prototype-v1";
  const STATUS_ORDER = ["backlog", "todo", "doing", "review", "done"];
  const STATUS_LABELS = {
    backlog: "Backlog",
    todo: "To Do",
    doing: "Doing",
    review: "Review",
    done: "Done"
  };
  const PRIORITY_LABELS = {
    critical: "最優先",
    high: "高",
    normal: "通常",
    low: "低"
  };

  const seedTasks = [
    {
      id: "task-target-industry",
      title: "宿泊・観光業以外のターゲット業界を決める",
      description: "宿泊・観光業を軸にしつつ、次にどの業界へ展開するかは未決。従業員規模、給与水準、福利厚生・退職金ニーズ、人材採用・定着の課題、制度導入余力、営業接点の作りやすさで比較し、優先する業界と提案の入口を決める。",
      status: "todo",
      priority: "critical",
      owner: "未定",
      due: "9月中",
      startMonth: 1,
      length: 2,
      parentNodeIds: ["decision-otherindustry"]
    },
    {
      id: "task-deadline-rule",
      title: "規約の承認申請の締切ルールを確定させる",
      description: "制度開始月から逆算した期限までに申請を完了させる必要があるとされている。ここが1か月動くだけで、第1波の契約期限そのものが変わる。日程を提案書やセミナーで口にする前に確定させること。",
      status: "todo",
      priority: "critical",
      owner: "未定",
      due: "今週",
      startMonth: 1,
      length: 1,
      parentNodeIds: ["decision-rule"]
    },
    {
      id: "task-pricing-range",
      title: "料金レンジの刻みと金額を決める",
      description: "規模レンジ別の固定料金という方針は決定済み。残るのは階段の刻みと金額。加入率の実測値がないと根拠を持てないため、第1段階の数社で測ってから確定させる。",
      status: "doing",
      priority: "high",
      owner: "未定",
      due: "9月上旬",
      startMonth: 1,
      length: 2,
      parentNodeIds: ["decision-fixedprice"]
    },
    {
      id: "task-measure-rate",
      title: "第1段階で加入率を実測する",
      description: "加入率が会社側の削減額をそのまま決める最大の変数。説明会の所要時間、出てくる質問、投入工数もあわせて記録する。ここが埋まらないと料金体系も工数見積もりも根拠を持てない。",
      status: "doing",
      priority: "high",
      owner: "未定",
      due: "既存顧問先への訪問と同時",
      startMonth: 2,
      length: 3,
      parentNodeIds: ["decision-measure"]
    },
    {
      id: "task-stopcost",
      title: "制度をやめるときの手続きと費用を確認する",
      description: "会社の一存では終われない制度。廃止時に誰が何をするのか、費用は誰が持つのか、加入者の資産はどうなるのかを確認する。",
      status: "backlog",
      priority: "normal",
      owner: "未定",
      due: "提案前",
      startMonth: 3,
      length: 2,
      parentNodeIds: ["issue-compliance"]
    },
    {
      id: "task-minwage",
      title: "最低賃金の抵触チェックを手順にする",
      description: "選択制は額面が下がるため、パート・短時間勤務者や若年層で最低賃金を下回るケースがあり得る。誰が、いつ、どうやって確認するかを手順として決める。",
      status: "todo",
      priority: "high",
      owner: "未定",
      due: "第1号導入前",
      startMonth: 3,
      length: 2,
      parentNodeIds: ["issue-compliance"]
    },
    {
      id: "task-srline",
      title: "社労士法上の独占業務との線引きを確認する",
      description: "算定基礎届の作成・提出代行は独占業務。どこまでを支援と呼べるのか、提携する社労士との役割分担もあわせて決める。",
      status: "review",
      priority: "high",
      owner: "未定",
      due: "第1号導入前",
      startMonth: 2,
      length: 2,
      parentNodeIds: ["issue-compliance"]
    },
    {
      id: "task-risktext",
      title: "デメリット説明の標準文面をつくる",
      description: "何を、どの順番で、どう記録に残すかを標準化する。「手取りは減ります」から始める順番、失う給付の一覧、勧めるべきでない人の判定を含める。",
      status: "todo",
      priority: "high",
      owner: "未定",
      due: "第1号説明会まで",
      startMonth: 2,
      length: 2,
      parentNodeIds: ["decision-rule"]
    },
    {
      id: "task-no-personal-sales",
      title: "個人向け営業を当面行わない方針を決める",
      description: "従業員個人への金融商品の提案は当面行わず、収益は顧問契約と法人保険で取る。個人収益を事業計画に組み込まない。",
      status: "done",
      priority: "normal",
      owner: "決定済み",
      due: "完了",
      startMonth: 1,
      length: 1,
      parentNodeIds: ["strategy-revenue"]
    }
  ];

  const nodes = [
    { id: "goal-business", title: "事業を成立させる", type: "目的", description: "まずは選択制DCの事業としての成立条件を満たす。営業・収益・実務運用の3つを揃えて進める。", parentIds: [] },
    { id: "strategy-sales", title: "営業戦略を決める", type: "戦略", description: "どの市場に、どの順序で、どんな入口で提案するかを決める。", parentIds: ["goal-business"] },
    { id: "strategy-revenue", title: "収益設計を固める", type: "戦略", description: "どこで収益を取り、どの案件を受けるかの前提を決める。", parentIds: ["goal-business"] },
    { id: "issue-target", title: "ターゲット業界を決める", type: "論点", description: "どの業界から攻めるかで、訴求の切り口も実行難易度も変わる。", parentIds: ["strategy-sales"] },
    { id: "issue-pricing", title: "料金体系を決める", type: "論点", description: "成果報酬ではなく固定料金で進める以上、規模別レンジをどう設計するかが重要。", parentIds: ["strategy-revenue"] },
    { id: "issue-compliance", title: "説明責任と実務運用を固める", type: "論点", description: "導入時の説明責任と、制度運用上の線引きを標準化しておく必要がある。", parentIds: ["goal-business"] },
    { id: "issue-firstcase", title: "第1号案件で何を測るか決める", type: "論点", description: "加入率、工数、質問内容など、第1号で何を測るかを先に決める。", parentIds: ["goal-business"] },
    { id: "decision-hotel", title: "宿泊・観光業を軸にする", type: "判断", description: "信頼関係があり課題も拾いやすい宿泊・観光業を最初の軸にする。", parentIds: ["issue-target"] },
    { id: "decision-otherindustry", title: "宿泊・観光業以外を比較する", type: "施策", description: "次に展開する業界候補を比較し、優先順位と提案の入口を定める。", parentIds: ["issue-target", "decision-hotel"] },
    { id: "decision-fixedprice", title: "規模レンジ別の固定料金にする", type: "判断", description: "導入支援と継続支援を含む固定料金型で設計し、成果報酬に依存しない。", parentIds: ["issue-pricing", "strategy-revenue"] },
    { id: "decision-measure", title: "加入率・工数・質問を実測する", type: "施策", description: "料金体系と工数見積もりの根拠にするため、第1段階で実測する。", parentIds: ["issue-firstcase", "strategy-revenue"] },
    { id: "decision-rule", title: "説明会ルールを標準化する", type: "施策", description: "申請締切、デメリット説明、保険営業の切り分けなど、止まりやすい部分を標準化する。", parentIds: ["issue-compliance", "strategy-sales"] }
  ];

  const nodeMap = new Map(nodes.map(node => [node.id, node]));
  const taskSeedMap = new Map(seedTasks.map(task => [task.id, task]));

  const state = {
    tasks: loadTasks(),
    selectedType: null,
    selectedId: null,
    mapFocusOnly: false
  };

  const navLinks = [...document.querySelectorAll(".side-nav [data-nav]")];
  const sections = [...document.querySelectorAll("[data-section]")];

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(seedTasks);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return structuredClone(seedTasks);
      return seedTasks.map(seed => {
        const saved = parsed.find(item => item.id === seed.id);
        return saved ? { ...seed, ...saved } : { ...seed };
      });
    } catch (error) {
      return structuredClone(seedTasks);
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }

  function getTaskById(taskId) {
    return state.tasks.find(task => task.id === taskId);
  }

  function getParentsForNode(nodeId, acc = new Set()) {
    const node = nodeMap.get(nodeId);
    if (!node) return acc;
    (node.parentIds || []).forEach(parentId => {
      if (!acc.has(parentId)) {
        acc.add(parentId);
        getParentsForNode(parentId, acc);
      }
    });
    return acc;
  }

  function getPathForTask(taskId) {
    const task = getTaskById(taskId);
    if (!task) return [];
    const chain = [];
    const mainParent = task.parentNodeIds?.[0];
    if (!mainParent) return [{ kind: "task", id: task.id, title: task.title }];
    const parentSet = getParentsForNode(mainParent);
    const sortedNodes = [...parentSet]
      .map(id => nodeMap.get(id))
      .filter(Boolean)
      .sort((a, b) => depthOfNode(a.id) - depthOfNode(b.id));
    sortedNodes.forEach(node => chain.push({ kind: "node", id: node.id, title: node.title }));
    if (nodeMap.has(mainParent) && !sortedNodes.some(item => item.id === mainParent)) {
      chain.push({ kind: "node", id: mainParent, title: nodeMap.get(mainParent).title });
    }
    if (sortedNodes[sortedNodes.length - 1]?.id !== mainParent && nodeMap.has(mainParent)) {
      chain.push({ kind: "node", id: mainParent, title: nodeMap.get(mainParent).title });
    }
    chain.push({ kind: "task", id: task.id, title: task.title });
    const unique = [];
    const seen = new Set();
    chain.forEach(item => {
      const key = `${item.kind}:${item.id}`;
      if (!seen.has(key)) {
        unique.push(item);
        seen.add(key);
      }
    });
    return unique;
  }

  function depthOfNode(nodeId, visited = new Set()) {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (!node || !node.parentIds || node.parentIds.length === 0) return 0;
    return 1 + Math.max(...node.parentIds.map(parentId => depthOfNode(parentId, new Set(visited))));
  }

  function getTasksForNode(nodeId) {
    return state.tasks.filter(task => (task.parentNodeIds || []).includes(nodeId));
  }

  function selectItem(type, id) {
    state.selectedType = type;
    state.selectedId = id;
    renderAll();
  }

  function clearSelection() {
    state.selectedType = null;
    state.selectedId = null;
    renderAll();
  }

  function toggleMapFilter(key) {
    state.mapFocusOnly = key === "focus";
    document.querySelectorAll("[data-map-filter]").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.mapFilter === key);
    });
    document.getElementById("mapGrid").classList.toggle("only-focus", state.mapFocusOnly);
  }

  function moveTask(taskId, nextStatus) {
    const task = getTaskById(taskId);
    if (!task || !STATUS_ORDER.includes(nextStatus)) return;
    task.status = nextStatus;
    saveTasks();
    renderAll();
  }

  function moveTaskRelative(taskId, direction) {
    const task = getTaskById(taskId);
    if (!task) return;
    const currentIndex = STATUS_ORDER.indexOf(task.status);
    const nextIndex = Math.max(0, Math.min(STATUS_ORDER.length - 1, currentIndex + direction));
    if (nextIndex !== currentIndex) {
      moveTask(taskId, STATUS_ORDER[nextIndex]);
    }
  }

  function statusBadge(status) {
    return `<span class="badge status ${status}">${STATUS_LABELS[status]}</span>`;
  }

  function renderDetailPanel() {
    const detailEmpty = document.getElementById("detailEmpty");
    const detailContent = document.getElementById("detailContent");
    const detailBadges = document.getElementById("detailBadges");
    const detailTitle = document.getElementById("detailTitle");
    const detailDescription = document.getElementById("detailDescription");
    const detailPath = document.getElementById("detailPath");
    const detailRelatedTasks = document.getElementById("detailRelatedTasks");
    const detailTaskMetaBlock = document.getElementById("detailTaskMetaBlock");
    const detailTaskMeta = document.getElementById("detailTaskMeta");

    if (!state.selectedType || !state.selectedId) {
      detailEmpty.classList.remove("hidden");
      detailContent.classList.add("hidden");
      return;
    }

    detailEmpty.classList.add("hidden");
    detailContent.classList.remove("hidden");

    if (state.selectedType === "task") {
      const task = getTaskById(state.selectedId);
      if (!task) return;
      detailBadges.innerHTML = `
        <span class="badge type">タスク</span>
        ${statusBadge(task.status)}
        <span class="badge priority">${PRIORITY_LABELS[task.priority]}</span>
      `;
      detailTitle.textContent = task.title;
      detailDescription.textContent = task.description;
      const path = getPathForTask(task.id);
      detailPath.innerHTML = path.map(item => `<span class="crumb">${item.title}</span>`).join("");
      const related = (task.parentNodeIds || [])
        .flatMap(nodeId => getTasksForNode(nodeId))
        .filter(item => item.id !== task.id);
      detailRelatedTasks.innerHTML = related.length
        ? related.map(item => `<button type="button" class="related-chip" data-related-task="${item.id}"><span>${item.title}</span><small>${STATUS_LABELS[item.status]}</small></button>`).join("")
        : `<div class="empty-mini">関連タスクはありません。</div>`;
      detailTaskMetaBlock.classList.remove("hidden");
      detailTaskMeta.innerHTML = `
        <div><b>現在のステータス：</b>${STATUS_LABELS[task.status]}</div>
        <div><b>優先度：</b>${PRIORITY_LABELS[task.priority]}</div>
        <div><b>担当：</b>${task.owner}</div>
        <div><b>期限：</b>${task.due}</div>
      `;
      document.getElementById("movePrevBtn").disabled = STATUS_ORDER.indexOf(task.status) === 0;
      document.getElementById("moveNextBtn").disabled = STATUS_ORDER.indexOf(task.status) === STATUS_ORDER.length - 1;
    } else {
      const node = nodeMap.get(state.selectedId);
      if (!node) return;
      detailBadges.innerHTML = `<span class="badge type">${node.type}</span>`;
      detailTitle.textContent = node.title;
      detailDescription.textContent = node.description;
      const pathIds = [...getParentsForNode(node.id)]
        .map(id => nodeMap.get(id))
        .filter(Boolean)
        .sort((a, b) => depthOfNode(a.id) - depthOfNode(b.id))
        .map(item => item.title);
      pathIds.push(node.title);
      detailPath.innerHTML = pathIds.map(title => `<span class="crumb">${title}</span>`).join("");
      const relatedTasks = getTasksForNode(node.id);
      detailRelatedTasks.innerHTML = relatedTasks.length
        ? relatedTasks.map(item => `<button type="button" class="related-chip" data-related-task="${item.id}"><span>${item.title}</span><small>${STATUS_LABELS[item.status]}</small></button>`).join("")
        : `<div class="empty-mini">このノードに直接ひもづくタスクはありません。</div>`;
      detailTaskMetaBlock.classList.add("hidden");
      detailTaskMeta.innerHTML = "";
    }

    detailRelatedTasks.querySelectorAll("[data-related-task]").forEach(btn => {
      btn.addEventListener("click", () => selectItem("task", btn.dataset.relatedTask));
    });
  }

  function getActiveIds() {
    const activeNodes = new Set();
    const activeTasks = new Set();

    if (!state.selectedType || !state.selectedId) {
      return { activeNodes, activeTasks, hasSelection: false };
    }

    if (state.selectedType === "task") {
      const task = getTaskById(state.selectedId);
      if (task) {
        activeTasks.add(task.id);
        (task.parentNodeIds || []).forEach(nodeId => {
          activeNodes.add(nodeId);
          getParentsForNode(nodeId).forEach(parentId => activeNodes.add(parentId));
        });
      }
    }

    if (state.selectedType === "node") {
      activeNodes.add(state.selectedId);
      getParentsForNode(state.selectedId).forEach(parentId => activeNodes.add(parentId));
      getTasksForNode(state.selectedId).forEach(task => activeTasks.add(task.id));
    }

    return { activeNodes, activeTasks, hasSelection: true };
  }

  function renderMap() {
    const { activeNodes, activeTasks, hasSelection } = getActiveIds();

    document.querySelectorAll(".map-node").forEach(el => {
      const isActive = activeNodes.has(el.dataset.nodeId);
      el.classList.toggle("is-active", isActive);
      el.classList.toggle("is-dim", hasSelection && !isActive);
    });
    document.querySelectorAll(".map-task").forEach(el => {
      const isActive = activeTasks.has(el.dataset.taskId);
      el.classList.toggle("is-active", isActive);
      el.classList.toggle("is-dim", hasSelection && !isActive);
    });
  }

  function createTaskCard(task) {
    const article = document.createElement("article");
    article.className = "task-card";
    article.draggable = true;
    article.dataset.taskId = task.id;
    if (state.selectedType === "task" && state.selectedId === task.id) {
      article.classList.add("is-selected");
    }

    article.innerHTML = `
      <div class="task-card__top">
        <div class="task-priority">${PRIORITY_LABELS[task.priority]}</div>
      </div>
      <h4>${task.title}</h4>
      <p>${task.description}</p>
      <div class="task-meta">
        <span class="meta-pill status ${task.status}">${STATUS_LABELS[task.status]}</span>
        <span class="meta-pill">期限：${task.due}</span>
        <span class="meta-pill">担当：${task.owner}</span>
      </div>
    `;

    article.addEventListener("click", () => selectItem("task", task.id));
    article.addEventListener("dragstart", event => {
      event.dataTransfer.setData("text/plain", task.id);
      event.dataTransfer.effectAllowed = "move";
      article.classList.add("is-dragging");
    });
    article.addEventListener("dragend", () => article.classList.remove("is-dragging"));

    return article;
  }

  function renderKanban() {
    STATUS_ORDER.forEach(status => {
      const zone = document.querySelector(`[data-dropzone="${status}"]`);
      const countEl = document.querySelector(`[data-count-for="${status}"]`);
      const list = state.tasks.filter(task => task.status === status);
      countEl.textContent = String(list.length);
      zone.innerHTML = "";
      list.forEach(task => zone.appendChild(createTaskCard(task)));
    });
  }

  function renderStatusSummary() {
    const counts = {
      backlog: state.tasks.filter(task => task.status === "backlog").length,
      todo: state.tasks.filter(task => task.status === "todo").length,
      doing: state.tasks.filter(task => task.status === "doing").length,
      review: state.tasks.filter(task => task.status === "review").length,
      done: state.tasks.filter(task => task.status === "done").length
    };
    const open = counts.backlog + counts.todo + counts.doing + counts.review;
    document.getElementById("openTaskCount").textContent = String(open);
    document.getElementById("statusLine").textContent = `未着手 ${counts.todo} ／ 進行中 ${counts.doing} ／ 確認中 ${counts.review}`;
  }

  function renderGantt() {
    const ganttTable = document.getElementById("ganttTable");
    const months = ["9月", "10月", "11月", "12月", "1月"];
    const header = `
      <div class="gantt-table">
        <div class="gantt-cell head sticky">TASK</div>
        ${months.map(month => `<div class="gantt-cell head">${month}</div>`).join("")}
        ${state.tasks.map((task, index) => {
          const start = Math.max(0, task.startMonth - 1);
          const width = Math.max(16, Math.min(100, task.length * 20));
          const offset = Math.min(80, start * 20);
          const rowClass = index === state.tasks.length - 1 ? "gantt-row-last" : "";
          return `
            <div class="${rowClass} gantt-cell label">${task.title}<br><span class="muted-tiny">${STATUS_LABELS[task.status]}</span></div>
            ${months.map((month, monthIndex) => {
              const track = monthIndex === 0
                ? `<div class="gantt-bar-track"><div class="gantt-bar-fill ${task.status}" style="left:${offset}%;width:${width}%;"></div></div>`
                : "";
              return `<div class="${rowClass} gantt-cell">${track}</div>`;
            }).join("")}
          `;
        }).join("")}
      </div>
    `;
    ganttTable.innerHTML = header;
  }

  function renderAll() {
    renderMap();
    renderKanban();
    renderGantt();
    renderDetailPanel();
    renderStatusSummary();
  }

  function bindNavHighlight() {
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.dataset.section;
        navLinks.forEach(link => link.classList.toggle("is-active", link.dataset.nav === id));
      }, { rootMargin: "-18% 0px -68% 0px", threshold: [0, .1, .25, .5] });
      sections.forEach(section => observer.observe(section));
    } else if (navLinks[0]) {
      navLinks[0].classList.add("is-active");
    }
  }

  function bindMap() {
    document.querySelectorAll(".map-node").forEach(btn => {
      btn.addEventListener("click", () => selectItem("node", btn.dataset.nodeId));
    });
    document.querySelectorAll(".map-task").forEach(btn => {
      btn.addEventListener("click", () => selectItem("task", btn.dataset.taskId));
    });
    document.querySelectorAll("[data-map-filter]").forEach(btn => {
      btn.addEventListener("click", () => toggleMapFilter(btn.dataset.mapFilter));
    });
    document.getElementById("clearSelectionBtn").addEventListener("click", clearSelection);
  }

  function bindKanbanDnD() {
    document.querySelectorAll(".kanban-dropzone").forEach(zone => {
      zone.addEventListener("dragover", event => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        zone.closest(".kanban-column")?.classList.add("is-over");
      });
      zone.addEventListener("dragleave", () => {
        zone.closest(".kanban-column")?.classList.remove("is-over");
      });
      zone.addEventListener("drop", event => {
        event.preventDefault();
        zone.closest(".kanban-column")?.classList.remove("is-over");
        const taskId = event.dataTransfer.getData("text/plain");
        const nextStatus = zone.dataset.dropzone;
        moveTask(taskId, nextStatus);
        selectItem("task", taskId);
      });
    });
  }

  function bindDetailActions() {
    document.getElementById("movePrevBtn").addEventListener("click", () => {
      if (state.selectedType === "task") moveTaskRelative(state.selectedId, -1);
    });
    document.getElementById("moveNextBtn").addEventListener("click", () => {
      if (state.selectedType === "task") moveTaskRelative(state.selectedId, 1);
    });
  }

  function bindReset() {
    document.getElementById("resetBoardBtn").addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      state.tasks = structuredClone(seedTasks);
      clearSelection();
      renderAll();
    });
  }

  bindNavHighlight();
  bindMap();
  bindKanbanDnD();
  bindDetailActions();
  bindReset();
  toggleMapFilter("all");
  renderAll();
})();
