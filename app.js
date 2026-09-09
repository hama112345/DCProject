
(() => {
  "use strict";

  const STORAGE_KEY = "dc-dashboard-prototype-v2";
  const STATUS_ORDER = ["backlog", "todo", "doing", "review", "done"];
  const STATUS_LABELS = { backlog:"Backlog", todo:"To Do", doing:"Doing", review:"Review", done:"Done" };
  const LEVEL_LABELS = { goal:"目的", q:"分からないこと", h:"見立て", e:"確かめ方", t:"今日やること" };

  const ym = (y,m) => y*12 + (m-1);
  const fromIdx = i => ({ y: Math.floor(i/12), m: i%12 + 1 });
  const fmt = o => `${o.y}年${o.m}月`;
  const NOW = ym(2026,8);
  const OPTIONS = [[2027,1],[2027,2],[2027,3],[2027,4],[2027,5],[2027,6],[2027,9],[2027,12]];
  const STEPS = [
    [-6,"導入を決めて、書類と会社規程を出してもらう"],
    [-5,"申請書類に押印して提出"],
    [-4,"規約の書類をつくる"],
    [-3,"国へ規約の申請／従業員へ説明会"],
    [-2,"国の審査／給与明細の変更を準備"],
    [-1,"加入する人と金額を確定（20日締切）"],
    [0,"制度スタート"]
  ];

  const LAYERS = [
    { key:"goal", name:"目的" },
    { key:"q", name:"分からないこと" },
    { key:"h", name:"見立て" },
    { key:"e", name:"確かめ方" },
    { key:"t", name:"今日やること" }
  ];

  const NODES = [
    {id:"g1", L:"goal", cd:"目的", t:"企業型DCを入口に、法人との継続取引をつくる", nt:"制度導入を単発で終わらせず、継続的な金融コンサル関係の入口として設計する。", up:[]},
    {id:"g2", L:"goal", cd:"第1号", t:"2027年3月に第1号を施行する", nt:"9月合意・標準6か月で逆算。翌月払いの会社なら3月施行が定時決定に最も効率よく乗る。", up:["g1"]},
    {id:"g3", L:"goal", cd:"再現性", t:"同じ形で他社に展開できる状態にする", nt:"個別対応で終わらせない。中期目標はアプローチ先10件。", up:["g1"]},

    {id:"q1", L:"q", cd:"Q1 収益", t:"どの報酬設計を採るか", nt:"削減額連動・階段型定額・3層構造の3案。成果報酬だけだと53名未満は赤字。", up:["g1","g3"]},
    {id:"q3", L:"q", cd:"Q3 対象", t:"どの規模・どの層に提案するか", nt:"53名が損益分岐。役員は税メリットが大きく、中間層は会社の削減効率が高い。", up:["g2","g3"]},
    {id:"q5", L:"q", cd:"Q5 リスク", t:"説明責任と保険営業をどう両立させるか", nt:"給付影響の説明は事業主の義務。個別営業は収益源だが利益相反を生む。", up:["g1"]},
    {id:"q6", L:"q", cd:"Q6 資金", t:"入金まで13か月をどう持ちこたえるか", nt:"合意から会社のCF実現まで13か月。10社並行なら数百万円の人件費が先行する。", up:["g3"]},

    {id:"h1", L:"h", cd:"H1", t:"3層構造なら小規模でも黒字化する", nt:"導入支援フィー＋成果報酬＋継続支援。加入率が20%に落ちても黒字を保つ。", up:["q1","q6"]},
    {id:"h3", L:"h", cd:"H3", t:"既存の保険取引先が最初の1社になる", nt:"9月合意に間に合うのは、すでに関係がある先だけ。規程の開示も含めて話が早い。", up:["q3"]},
    {id:"h7", L:"h", cd:"H7", t:"投資教育を軸に月額収益化できる", nt:"義務として発生する教育を、有償の運用支援メニューに束ねる。", up:["q1"]},
    {id:"h8", L:"h", cd:"H8", t:"宿泊・観光業を軸にしつつ次の業界候補を比較する", nt:"建設業や介護・福祉を固定せず、宿泊・観光業以外の候補を比較して優先順位を決める。", up:["q3"]},
    {id:"h9", L:"h", cd:"H9", t:"説明会ルールを標準化しないと案件化後に止まる", nt:"説明責任、最低賃金、社労士との線引きを整えないと実務上の停止要因になる。", up:["q5"]},

    {id:"e1", L:"e", cd:"E1", t:"委託契約の報酬体系を確認する", nt:"導入時・継続それぞれの取り分を契約書と担当者への確認で明確にする。", up:["h1"]},
    {id:"e4", L:"e", cd:"E4", t:"DMを発出し反応率を測る", nt:"300〜500社に発出、10月中旬までに先行接触。反応率から10件の達成可能性を判断する。", up:["h3"]},
    {id:"e6", L:"e", cd:"E6", t:"説明会と保険提案の運用ルールを整える", nt:"時間分離、同意書、記録方法、担当分離。コンプライアンス確認を通す。", up:["h9"]},
    {id:"e7", L:"e", cd:"E7", t:"第1号で実稼働時間を実測する", nt:"提案から施行までの自社工数を記録し、損益分岐の前提を確定させる。", up:["h7","h1"]},
    {id:"e8", L:"e", cd:"E8", t:"候補業界を比較し優先順位を決める", nt:"従業員規模、給与水準、退職金ニーズ、採用・定着課題、制度導入余力で比較する。", up:["h8"]},

    {id:"t1", L:"t", t:"委託契約書の報酬条項を読む", nt:"導入時・継続の報酬条項を確認する。", up:["e1"], due:"8月中"},
    {id:"t2", L:"t", t:"代表事業主に収益条件を確認する", nt:"実際の受取条件を確認する。", up:["e1"], due:"8月中"},
    {id:"t3", L:"t", t:"報酬3案を比較し1案に決める", nt:"削減額連動・階段型定額・3層構造の比較。", up:["e1"], due:"9月上旬"},
    {id:"t4", L:"t", t:"10社想定の資金繰り表を作る", nt:"合意から入金まで13か月の先行負担を見積もる。", up:["h1"], due:"9月上旬"},
    {id:"t5", L:"t", t:"DM原稿の限度額の誤りを直す", nt:"2万3千円から6万2千円へ、という誤記を修正する。", up:["e4"], due:"8月中"},
    {id:"t6", L:"t", t:"DMを作成し300〜500社に発出", nt:"9月中に送付し、先行接触へ進む。", up:["e4"], due:"9月中"},
    {id:"t7", L:"t", t:"本命2〜3社を選定する", nt:"今から合意できる候補を絞る。", up:["e4"], due:"8月中"},
    {id:"t8", L:"t", t:"等級ベースの試算表を作る", nt:"現在等級と積立後等級を突き合わせる。", up:["e7"], due:"9月上旬"},
    {id:"t10", L:"t", t:"説明会ルールを文書化する", nt:"説明会と保険提案を分けるルールを整える。", up:["e6"], due:"9月中"},
    {id:"t11", L:"t", t:"会社向け同意書のひな形を作る", nt:"説明と同意の標準文書を用意する。", up:["e6"], due:"9月中"},
    {id:"t12", L:"t", t:"社労士の連携先を確保する", nt:"規程変更と説明監修の両方で必要。", up:["e6","e7"], due:"9月中"},
    {id:"t13", L:"t", t:"稼働時間の記録フォーマットを作る", nt:"第1号で工数を実測できるようにする。", up:["e7"], due:"9月中"},
    {id:"t14", L:"t", t:"宿泊・観光業以外のターゲット業界を決める", nt:"次にどの業界へ展開するかを決める。", up:["e8"], due:"9月中"}
  ];

  const TASK_SEED = {
    t1: { status:"done" }, t2:{ status:"review" }, t3:{ status:"doing" }, t4:{ status:"todo" },
    t5:{ status:"done" }, t6:{ status:"todo" }, t7:{ status:"backlog" }, t8:{ status:"doing" },
    t10:{ status:"todo" }, t11:{ status:"todo" }, t12:{ status:"review" }, t13:{ status:"todo" }, t14:{ status:"todo" }
  };

  const MONTHS = [
    {y:2026,m:8,l:"8月",now:1},{y:2026,m:9,l:"9月"},{y:2026,m:10,l:"10月"},{y:2026,m:11,l:"11月"},
    {y:2026,m:12,l:"12月",key:1},{y:2027,m:1,l:"1月"},{y:2027,m:2,l:"2月"},{y:2027,m:3,l:"3月"},
    {y:2027,m:4,l:"4月"},{y:2027,m:5,l:"5月"},{y:2027,m:6,l:"6月"},{y:2027,m:7,l:"7月"},
    {y:2027,m:8,l:"8月"},{y:2027,m:9,l:"9月",key:1},{y:2027,m:10,l:"10月"}
  ];
  const GANTT_ROWS = [
    {l:"制度・法令",w:"h",wt:"法令",f:[[4,"12/1 上限62,000円",""],[13,"9/1 厚年上限68万",""]]},
    {l:"自社の準備",w:"j",wt:"自社",b:[[0,3,"j","報酬設計・試算表・説明会ルール"]]},
    {l:"DM・営業",w:"j",wt:"自社",b:[[1,15,"j","DM発出 → 先行接触 → 面談 → 提案（継続）"]]},
    {l:"第1号 導入工程",w:"u",wt:"案件",b:[[1,7,"u","規程整備 → 規約申請 → 厚生局審査 → 加入者登録"]],f:[[7,"3月 施行","a"]]},
    {l:"第1号 社会保険",w:"k",wt:"手続",b:[[8,11,"k","4〜6月支払分が算定基礎"]],f:[[11,"算定基礎届","a"],[13,"9月 等級改定",""]]},
    {l:"削減の実現",w:"c",wt:"CF",f:[[12,"8月 通知書","g"],[14,"10月 CF実現","g"]]},
    {l:"報酬の請求",w:"c",wt:"収益",b:[[12,15,"c","通知書ベースで請求"]]},
    {l:"第2号（11月合意）",w:"u",wt:"案件",b:[[3,9,"u","導入工程"]],f:[[9,"5月 施行","a"]]},
    {l:"継続支援",w:"j",wt:"自社",b:[[7,15,"s","投資教育・フォロー・顧問提案"]]}
  ];

  const nx = new Map(NODES.map(n => [n.id, n]));
  const children = new Map();
  NODES.forEach(n => children.set(n.id, []));
  NODES.forEach(n => (n.up || []).forEach(p => children.get(p)?.push(n.id)));

  const navLinks = [...document.querySelectorAll('.side-nav [data-nav]')];
  const sections = [...document.querySelectorAll('[data-section]')];

  const state = {
    selectedMonth: ym(2027,3),
    selectedId: null,
    tasks: loadTasks()
  };

  function loadTasks() {
    const taskNodes = NODES.filter(n => n.L === 't').map(n => ({
      id: n.id,
      title: n.t,
      description: n.nt,
      due: n.due || '未設定',
      up: [...(n.up || [])],
      status: TASK_SEED[n.id]?.status || 'todo'
    }));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return taskNodes;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved)) return taskNodes;
      return taskNodes.map(task => ({ ...task, ...(saved.find(s => s.id === task.id) || {}) }));
    } catch {
      return taskNodes;
    }
  }

  function saveTasks() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks)); }
  function getTask(id) { return state.tasks.find(t => t.id === id); }
  function getNode(id) { return nx.get(id); }

  function ancestors(id, acc = new Set()) {
    const n = getNode(id);
    (n?.up || []).forEach(p => { if (!acc.has(p)) { acc.add(p); ancestors(p, acc); } });
    return acc;
  }
  function descendants(id, acc = new Set()) {
    (children.get(id) || []).forEach(c => { if (!acc.has(c)) { acc.add(c); descendants(c, acc); } });
    return acc;
  }
  function lineage(id) {
    const set = new Set([id]);
    ancestors(id).forEach(x => set.add(x));
    descendants(id).forEach(x => set.add(x));
    return set;
  }
  function depth(id, seen = new Set()) {
    if (seen.has(id)) return 0;
    seen.add(id);
    const n = getNode(id);
    if (!n?.up?.length) return 0;
    return 1 + Math.max(...n.up.map(p => depth(p, new Set(seen))));
  }

  function bindNavHighlight() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const id = visible.target.dataset.section;
        navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.nav === id));
      }, { rootMargin: '-18% 0px -68% 0px', threshold: [0,.1,.25,.5] });
      sections.forEach(section => observer.observe(section));
    } else if (navLinks[0]) navLinks[0].classList.add('is-active');
  }

  function nextSept(idx) { const o = fromIdx(idx); return ym(o.m > 6 ? o.y + 1 : o.y, 9); }
  function renderPlanner() {
    const pick = document.getElementById('plannerPick');
    pick.innerHTML = '';
    OPTIONS.forEach(([y,m]) => {
      const val = ym(y,m);
      const btn = document.createElement('button');
      btn.className = 'pk';
      btn.type = 'button';
      btn.setAttribute('aria-pressed', String(val === state.selectedMonth));
      btn.textContent = fmt({y,m});
      btn.addEventListener('click', () => { state.selectedMonth = val; renderPlanner(); });
      pick.appendChild(btn);
    });

    const chosen = state.selectedMonth;
    const start = chosen - 6;
    const slack = start - NOW;
    const result = document.getElementById('plannerResult');
    if (slack < 0) {
      result.className = 'result no';
      result.textContent = `間に合いません。導入の合意は ${fmt(fromIdx(start))} が期限でした。`;
    } else if (slack === 0) {
      result.className = 'result tight';
      result.textContent = '今月中に合意が必要です。余裕はありません。';
    } else if (slack <= 1) {
      result.className = 'result tight';
      result.textContent = `合意の期限まであと ${slack}か月。急いでください。`;
    } else {
      result.className = 'result go';
      result.textContent = `間に合います。合意の期限まであと ${slack}か月。`;
    }

    const first = chosen + 1;
    const apply = nextSept(first);
    const cash = apply + 1;
    document.getElementById('summaryAgreement').textContent = fmt(fromIdx(start));
    document.getElementById('summaryApply').textContent = fmt(fromIdx(apply));
    document.getElementById('summaryCash').textContent = fmt(fromIdx(cash));

    let h = '<table class="steps-table"><tr><th>時期</th><th>やること</th></tr>';
    STEPS.forEach(([off,txt]) => {
      const idx = chosen + off;
      const past = idx < NOW;
      h += `<tr class="${past ? 'past' : ''}"><td><b>${fmt(fromIdx(idx))}</b></td><td>${txt}${past ? '（期限を過ぎています）' : ''}</td></tr>`;
    });
    h += `<tr><td><b>${fmt(fromIdx(first))}</b></td><td>下がった給与が初めて支払われる（翌月払いの場合）</td></tr>`;
    h += `<tr><td><b>${fmt(fromIdx(apply))}</b></td><td>新しい社会保険料が適用される</td></tr>`;
    h += `<tr><td><b>${fmt(fromIdx(cash))}</b></td><td><b>会社が納める金額が実際に減る</b></td></tr>`;
    h += '</table>';
    const fm = fromIdx(first).m;
    h += `<p class="steps-note">${fm <= 4 ? '下がった給与が4月までに支払われるので、4〜6月の平均にきちんと反映されます。' : `下がった給与が${fm}月からになるため、その年の4〜6月には間に合いません。新しい保険料が適用されるのは翌年になります。`}</p>`;
    document.getElementById('plannerSteps').innerHTML = h;
  }

  function renderMap() {
    const grid = document.getElementById('mapGrid');
    grid.innerHTML = '';
    const active = state.selectedId ? lineage(state.selectedId) : null;

    LAYERS.forEach(layer => {
      const col = document.createElement('div');
      col.className = 'map-col';
      col.innerHTML = `<div class="map-col__title">${layer.name}</div>`;
      NODES.filter(n => n.L === layer.key).forEach(node => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'map-node';
        btn.dataset.id = node.id;
        btn.dataset.level = node.L;
        btn.innerHTML = `${node.cd ? `<small>${node.cd}</small>` : ''}${node.t}`;
        if (state.selectedId === node.id) btn.classList.add('is-active');
        if (active && !active.has(node.id)) btn.classList.add('is-dim');
        btn.addEventListener('click', () => { state.selectedId = node.id; renderAll(); });
        col.appendChild(btn);
      });
      grid.appendChild(col);
    });
  }

  function nodePath(id) {
    const current = getNode(id);
    if (!current) return [];
    const parentChain = [...ancestors(id)].map(getNode).filter(Boolean).sort((a,b) => depth(a.id) - depth(b.id));
    const out = [];
    const seen = new Set();
    [...parentChain, current].forEach(n => {
      if (!seen.has(n.id)) { out.push(n); seen.add(n.id); }
    });
    return out;
  }

  function relatedTaskIds(nodeId) {
    return [...descendants(nodeId)].filter(id => getNode(id)?.L === 't');
  }

  function renderDetail() {
    const empty = document.getElementById('detailEmpty');
    const content = document.getElementById('detailContent');
    const badges = document.getElementById('detailBadges');
    const title = document.getElementById('detailTitle');
    const desc = document.getElementById('detailDescription');
    const path = document.getElementById('detailPath');
    const related = document.getElementById('detailRelated');
    const actions = document.getElementById('detailTaskActions');

    if (!state.selectedId) {
      empty.classList.remove('hidden');
      content.classList.add('hidden');
      return;
    }
    empty.classList.add('hidden');
    content.classList.remove('hidden');

    const node = getNode(state.selectedId);
    if (!node) return;
    title.textContent = node.t;
    desc.textContent = node.nt || '';
    badges.innerHTML = `<span class="badge type">${LEVEL_LABELS[node.L]}</span>`;
    const p = nodePath(node.id);
    path.innerHTML = p.map(n => `<span class="crumb">${n.t}</span>`).join('');

    let taskIds = [];
    if (node.L === 't') {
      const task = getTask(node.id);
      badges.innerHTML += task ? ` <span class="badge status ${task.status}">${STATUS_LABELS[task.status]}</span>` : '';
      taskIds = [node.id];
      actions.classList.remove('hidden');
      document.getElementById('movePrevBtn').disabled = !task || STATUS_ORDER.indexOf(task.status) === 0;
      document.getElementById('moveNextBtn').disabled = !task || STATUS_ORDER.indexOf(task.status) === STATUS_ORDER.length - 1;
    } else {
      taskIds = relatedTaskIds(node.id);
      actions.classList.add('hidden');
    }

    related.innerHTML = taskIds.length
      ? taskIds.map(id => {
          const t = getTask(id);
          const n = getNode(id);
          return `<button type="button" class="related-chip" data-task="${id}"><span>${n?.t || id}</span><small>${t ? STATUS_LABELS[t.status] : ''}</small></button>`;
        }).join('')
      : '<div class="empty-mini">関連タスクはありません。</div>';

    related.querySelectorAll('[data-task]').forEach(btn => btn.addEventListener('click', () => { state.selectedId = btn.dataset.task; renderAll(); }));
  }

  function createTaskCard(task) {
    const article = document.createElement('article');
    article.className = 'task-card';
    article.draggable = true;
    article.dataset.taskId = task.id;
    if (state.selectedId === task.id) article.classList.add('is-selected');
    article.innerHTML = `
      <div class="task-card__title">${task.title}</div>
      <div class="task-card__meta">
        <span class="task-card__due">期限：${task.due}</span>
        <span class="status-pill ${task.status}">${STATUS_LABELS[task.status]}</span>
      </div>`;
    article.addEventListener('click', () => { state.selectedId = task.id; renderAll(); });
    article.addEventListener('dragstart', event => {
      event.dataTransfer.setData('text/plain', task.id);
      event.dataTransfer.effectAllowed = 'move';
    });
    return article;
  }

  function renderKanban() {
    STATUS_ORDER.forEach(status => {
      const zone = document.querySelector(`[data-dropzone="${status}"]`);
      const countEl = document.querySelector(`[data-count-for="${status}"]`);
      const list = state.tasks.filter(t => t.status === status);
      zone.innerHTML = '';
      list.forEach(task => zone.appendChild(createTaskCard(task)));
      countEl.textContent = String(list.length);
    });
  }

  function renderStatusSummary() {
    const counts = Object.fromEntries(STATUS_ORDER.map(s => [s, state.tasks.filter(t => t.status === s).length]));
    const open = counts.backlog + counts.todo + counts.doing + counts.review;
    document.getElementById('openTaskCount').textContent = String(open);
    document.getElementById('statusLine').textContent = `未着手 ${counts.todo} ／ 進行中 ${counts.doing} ／ 確認中 ${counts.review}`;
  }

  function moveTask(taskId, status) {
    const task = getTask(taskId);
    if (!task || !STATUS_ORDER.includes(status)) return;
    task.status = status;
    saveTasks();
    renderAll();
  }

  function moveSelected(direction) {
    const task = getTask(state.selectedId);
    if (!task) return;
    const i = STATUS_ORDER.indexOf(task.status);
    const ni = Math.max(0, Math.min(STATUS_ORDER.length - 1, i + direction));
    if (ni !== i) moveTask(task.id, STATUS_ORDER[ni]);
  }

  function bindDnD() {
    document.querySelectorAll('.kanban-dropzone').forEach(zone => {
      zone.addEventListener('dragover', event => {
        event.preventDefault();
        zone.closest('.kanban-column')?.classList.add('is-over');
      });
      zone.addEventListener('dragleave', () => zone.closest('.kanban-column')?.classList.remove('is-over'));
      zone.addEventListener('drop', event => {
        event.preventDefault();
        zone.closest('.kanban-column')?.classList.remove('is-over');
        const taskId = event.dataTransfer.getData('text/plain');
        moveTask(taskId, zone.dataset.dropzone);
        state.selectedId = taskId;
        renderAll();
      });
    });
  }

  function renderMasterGantt() {
    let h = '<div class="gh corner" style="grid-row:1;grid-column:1">&nbsp;</div>';
    MONTHS.forEach((m, i) => {
      const c = m.now ? ' now' : (m.key ? ' key' : '');
      const yr = (i === 0 || m.m === 1) ? `<div class="yr">${m.y}</div>` : '';
      h += `<div class="gh${c}" style="grid-row:1;grid-column:${i+2}">${yr}${m.l}${m.now ? '<div>今</div>' : ''}</div>`;
    });
    GANTT_ROWS.forEach((r, ri) => {
      const row = ri + 2;
      h += `<div class="gl" style="grid-row:${row};grid-column:1"><span class="wb ${r.w}">${r.wt}</span>${r.l}</div>`;
      for (let i=0;i<MONTHS.length;i++) {
        const c = MONTHS[i].now ? ' now' : (MONTHS[i].key ? ' key' : '');
        h += `<div class="gc${c}" style="grid-row:${row};grid-column:${i+2}"></div>`;
      }
      (r.b || []).forEach(([s,e,cls,txt]) => {
        h += `<div class="gbar ${cls}" style="grid-row:${row};grid-column:${s+2} / ${e+2}">${txt}</div>`;
      });
      (r.f || []).forEach(([c, txt, k]) => {
        h += `<div class="gflag ${k}" style="grid-row:${row};grid-column:${c+2}">${txt}</div>`;
      });
    });
    document.getElementById('masterGantt').innerHTML = h;
  }

  function renderAll() {
    renderPlanner();
    renderMap();
    renderDetail();
    renderKanban();
    renderStatusSummary();
    renderMasterGantt();
  }

  document.getElementById('movePrevBtn').addEventListener('click', () => moveSelected(-1));
  document.getElementById('moveNextBtn').addEventListener('click', () => moveSelected(1));
  document.getElementById('resetBoardBtn').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    state.tasks = loadTasks();
    state.selectedId = null;
    renderAll();
  });

  bindNavHighlight();
  bindDnD();
  renderAll();
})();
