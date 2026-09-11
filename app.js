
(() => {
  "use strict";

  const STORAGE_KEY = "dc-dashboard-prototype-v2";
  const STATUS_ORDER = ["backlog", "todo", "doing", "review", "done"];
  const STATUS_LABELS = { backlog:"後で着手", todo:"未着手", doing:"進行中", review:"確認待ち", done:"完了" };
  const LEVEL_LABELS = { goal:"目的", q:"検討課題", h:"仮説", e:"検証", t:"アクション" };

  const ym = (y,m) => y*12 + (m-1);
  const fromIdx = i => ({ y: Math.floor(i/12), m: i%12 + 1 });
  const fmt = o => `${o.y}年${o.m}月`;
  const NOW = ym(new Date().getFullYear(),new Date().getMonth()+1);
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

  const TRACKS = [
    {id:'preparation',title:'事業準備',icon:'01',period:'8〜10月',description:'報酬設計・試算・説明ルールを揃え、提案できる状態にする。',ids:['t1','t2','t3','t4','t8','t10','t11','t12','t13']},
    {id:'sales',title:'営業・候補企業の開拓',icon:'02',period:'9月〜',description:'候補企業を絞り、DMと個別提案から最初の合意につなげる。',ids:['t5','t6','t7','t14']}
  ];
  const TODAY = new Date();
  const TODAY_START = new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()).getTime();
  const TASK_KEY = 'dc-dashboard-v3';
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nx = new Map(NODES.map(n => [n.id,n]));
  const children = new Map(NODES.map(n => [n.id,[]]));
  NODES.forEach(n => (n.up || []).forEach(p => children.get(p)?.push(n.id)));
  const seedTasks = () => NODES.filter(n=>n.L==='t').map(n=>({id:n.id,title:n.t,description:n.nt,due:n.due,status:TASK_SEED[n.id]?.status || 'todo',track:TRACKS.find(t=>t.ids.includes(n.id))?.id || 'preparation'}));
  function loadState(){
    const base = {tasks:seedTasks(),updatedAt:null,selectedMonth:ym(2027,3),saveFailed:false};
    try {
      const raw = localStorage.getItem(TASK_KEY) || localStorage.getItem(STORAGE_KEY);
      if(!raw) return base;
      const parsed = JSON.parse(raw), saved = Array.isArray(parsed) ? parsed : parsed?.tasks;
      if(!Array.isArray(saved)) return base;
      base.tasks.forEach(task=>{const row=saved.find(t=>t?.id===task.id);if(row && STATUS_ORDER.includes(row.status))task.status=row.status;});
      base.updatedAt=typeof parsed.updatedAt==='string' && !Number.isNaN(Date.parse(parsed.updatedAt)) ? parsed.updatedAt : null;
      base.imported = Array.isArray(parsed) || parsed.imported === true;
      if(OPTIONS.some(([y,m])=>ym(y,m)===parsed.selectedMonth))base.selectedMonth=parsed.selectedMonth;
    } catch {base.storageWarning=true;}
    return base;
  }
  const state = {...loadState(),selectedId:null,filter:'all',view:'overview'};
  let toastTimer, returnFocus;
  function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3000);}
  function persist(){
    try {localStorage.setItem(TASK_KEY,JSON.stringify({tasks:state.tasks.map(({id,status})=>({id,status})),updatedAt:state.updatedAt,selectedMonth:state.selectedMonth,imported:!!state.imported}));state.saveFailed=false;return true;}
    catch {state.saveFailed=true;return false;}
  }
  const taskById = id => state.tasks.find(t=>t.id===id);
  const trackById = id => TRACKS.find(t=>t.id===id);
  function dueBoundary(task){const month=Number(task.due.match(/(\d+)月/)?.[1]);if(!month)return Infinity;return task.due.includes('上旬') ? new Date(2026,month-1,10).getTime() : new Date(2026,month,0).getTime();}
  const overdue = task => task.status !== 'done' && dueBoundary(task) < TODAY_START;
  function priorityTasks(tasks=state.tasks){const rank={review:0,doing:1,todo:2,backlog:3,done:4};return tasks.filter(t=>t.status!=='done').sort((a,b)=>dueBoundary(a)-dueBoundary(b) || rank[a.status]-rank[b.status] || Number(a.id.slice(1))-Number(b.id.slice(1)));}
  function ancestors(id,seen=new Set()){(nx.get(id)?.up||[]).forEach(p=>{if(!seen.has(p)){seen.add(p);ancestors(p,seen);}});return seen;}
  function descendants(id,seen=new Set()){(children.get(id)||[]).forEach(c=>{if(!seen.has(c)){seen.add(c);descendants(c,seen);}});return seen;}
  function statusPill(status){return `<span class="pill ${status}">${STATUS_LABELS[status]}</span>`;}
  function dueLabel(task){return `<span class="${overdue(task)?'due-alert':''}">${task.due}${overdue(task)?' · 期限超過':''}</span>`;}
  function renderOverview(){
    const done=state.tasks.filter(t=>t.status==='done').length,total=state.tasks.length;
    const active=state.tasks.filter(t=>['doing','review'].includes(t.status)).length;
    const late=state.tasks.filter(overdue).length,pct=Math.round(done/total*100);
    $('navTaskCount').textContent=total-done;
    $('metrics').innerHTML=`<article class="metric"><div class="metric-label">登録タスクの完了<span>${pct}%</span></div><div class="metric-value">${done}<span class="slash-count"> / ${total}</span><small>件</small></div><div class="progress" role="progressbar" aria-label="登録タスクの完了率" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></article><article class="metric"><div class="metric-label">進行中・確認待ち</div><div class="metric-value">${active}<small>件</small></div><p class="metric-note">進行中 ${state.tasks.filter(t=>t.status==='doing').length} · 確認待ち ${state.tasks.filter(t=>t.status==='review').length}</p></article><article class="metric ${late?'alert':''}"><div class="metric-label">期限を過ぎた未完了<b>要確認</b></div><div class="metric-value">${late}<small>件</small></div><p class="metric-note">${late?'期日の見直し・完了確認が必要':'期限超過のタスクはありません'}</p></article><article class="metric"><div class="metric-label">次の節目 · 導入合意</div><div class="metric-value date-value">2026.09<small>月中</small></div><p class="metric-note">合意実績は未登録</p></article>`;
    const stages=[{title:'準備・合意',time:'2026.08 — 09',start:ym(2026,8),end:ym(2026,9)},{title:'導入手続き',time:'2026.10 — 2027.02',start:ym(2026,10),end:ym(2027,2)},{title:'第1号施行',time:'2027.03',start:ym(2027,3),end:ym(2027,3)},{title:'検証・継続支援',time:'2027.04 —',start:ym(2027,4),end:Infinity}];
    $('journey').innerHTML=stages.map((s,i)=>{const current=NOW>=s.start&&NOW<=s.end;return `<div class="journey-step ${current?'current':''}"><span class="step-number">${String(i+1).padStart(2,'0')}</span><h3>${s.title}</h3><p>${s.time}</p><small>${current?'計画上の現在地':NOW>s.end?'実績未登録':'予定'}</small></div>`;}).join('');
    const next=priorityTasks().slice(0,3);
    $('nextCount').textContent=`${next.length}件`;
    $('nextActions').innerHTML=next.length?next.map((t,i)=>`<button class="action-row" data-task="${t.id}"><span class="action-number">${i+1}</span><span class="action-body"><span class="action-title">${escapeHTML(t.title)}</span><span class="action-meta">${statusPill(t.status)}${dueLabel(t)}</span></span><span class="action-arrow" aria-hidden="true">↗</span></button>`).join(''):'<div class="empty-state">登録タスクはすべて完了しています。<br>次の工程の計画を確認しましょう。</div>';
    $('trackCards').innerHTML=TRACKS.map(track=>{const tasks=state.tasks.filter(t=>t.track===track.id),count=tasks.filter(t=>t.status==='done').length,nextTask=priorityTasks(tasks)[0];return `<article class="track-card ${track.id}"><div class="track-heading"><span class="track-icon">${track.icon}</span><h3>${track.title}</h3><small>${track.period}</small></div><p class="track-description">${track.description}</p><div class="track-count"><span>登録タスクの完了</span><strong>${count}<span> / ${tasks.length}</span></strong></div><div class="progress" role="progressbar" aria-label="${track.title}のタスク完了率" aria-valuenow="${Math.round(count/tasks.length*100)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${count/tasks.length*100}%"></span></div><div class="track-next"><small>次に進めること</small>${nextTask?`<button data-task="${nextTask.id}">${escapeHTML(nextTask.title)} <span aria-hidden="true">↗</span></button>`:'登録タスクはすべて完了'}<a class="text-link" href="#tasks" data-track-link="${track.id}">関連タスクを見る →</a></div></article>`;}).join('')+`<article class="track-card delivery"><div class="track-heading"><span class="track-icon">03</span><h3>第1号案件の導入</h3><small>9月〜翌3月</small></div><p class="track-description">合意から規程整備・審査・説明会を経て、制度をスタートする。</p><div class="track-count"><span>実績の登録状況</span><strong style="font-size:.9375rem">進捗未登録</strong></div><div class="progress"></div><div class="track-next"><small>次の節目</small>9月中に導入合意<a class="text-link" href="#schedule">導入の計画を確認 →</a></div></article>`;
    const changed=state.updatedAt||state.imported;
    $('dataMode').textContent=changed?'更新した進捗':'サンプル進捗';
    $('dataDescription').textContent=changed?(state.updatedAt?`最終更新 ${new Date(state.updatedAt).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})} · このブラウザの進捗を反映`:'このブラウザに保存されていた進捗を引き継いでいます。'):'提供ファイルの初期状態を表示しています。進捗を更新して使えます。';
    $('saveLabel').textContent=state.saveFailed?'未保存 · この画面のみ反映':'このブラウザに保存';
    $('saveLabel').classList.toggle('due-alert',state.saveFailed);
  }
  function renderBoard(){
    const filtered=state.tasks.filter(t=>state.filter==='all'||t.track===state.filter);
    $('kanbanBoard').innerHTML=STATUS_ORDER.map(status=>{const tasks=filtered.filter(t=>t.status===status);return `<section class="kanban-column" data-status="${status}" aria-label="${STATUS_LABELS[status]}"><h2 class="kanban-head">${STATUS_LABELS[status]}<span>${tasks.length}</span></h2><div class="dropzone" data-dropzone="${status}">${tasks.length?tasks.map(t=>`<button class="task-card" draggable="true" data-task="${t.id}"><span class="task-category">${trackById(t.track).title}</span><strong>${escapeHTML(t.title)}</strong><span class="task-meta">${dueLabel(t)}<span class="task-id">${t.id.toUpperCase()}</span></span></button>`).join(''):'<div class="empty-state">タスクはありません</div>'}</div></section>`;}).join('');
    document.querySelectorAll('[data-track]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.track===state.filter)));
  }
  function renderMap(){
    const active=state.selectedId?new Set([state.selectedId,...ancestors(state.selectedId),...descendants(state.selectedId)]):null;
    $('mapGrid').innerHTML=LAYERS.map(l=>`<div class="map-col"><h2 class="map-col-title">${LEVEL_LABELS[l.key]}</h2>${NODES.filter(n=>n.L===l.key).map(n=>`<button class="map-node ${state.selectedId===n.id?'is-active':''} ${active&&!active.has(n.id)?'is-dim':''}" data-node="${n.id}" data-level="${n.L}" aria-pressed="${state.selectedId===n.id}">${n.cd?`<small>${escapeHTML(n.cd)}</small>`:''}${escapeHTML(n.t)}${n.L==='t'?statusPill(taskById(n.id).status):''}</button>`).join('')}</div>`).join('');
  }
  function renderDetail(){
    const node=nx.get(state.selectedId);if(!node)return;
    const task=taskById(node.id);
    const chain=[...ancestors(node.id)].map(id=>nx.get(id)).sort((a,b)=>LAYERS.findIndex(l=>l.key===a.L)-LAYERS.findIndex(l=>l.key===b.L));
    const related=[...descendants(node.id)].map(taskById).filter(Boolean);
    $('detailBody').innerHTML=`<div>${task?statusPill(task.status):`<span class="outline-pill">${LEVEL_LABELS[node.L]}</span>`}</div><h2 id="detailTitle">${escapeHTML(node.t)}</h2><p class="detail-description">${escapeHTML(node.nt)}</p>${task?`<div class="detail-meta"><div><span class="meta-label">取り組み</span><span>${trackById(task.track).title}</span></div><div><span class="meta-label">期限</span><span>2026年 ${dueLabel(task)}</span></div><div><span class="meta-label">担当者</span><span>未設定</span></div><div><label for="taskStatus">進捗</label><select id="taskStatus">${STATUS_ORDER.map(s=>`<option value="${s}" ${s===task.status?'selected':''}>${STATUS_LABELS[s]}</option>`).join('')}</select></div></div><div class="detail-actions">${task.status!=='done'?`<button class="button primary" data-complete="${task.id}">完了にする ✓</button>`:'<span class="pill done">完了済み</span>'}<a class="button secondary" href="simulator.html">試算を開く ↗</a></div>`:''}${chain.length?`<div class="detail-section"><h3>この取り組みにつながる背景</h3>${chain.map(n=>`<div class="context-item"><small>${LEVEL_LABELS[n.L]}</small>${escapeHTML(n.t)}</div>`).join('')}</div>`:''}${related.length?`<div class="detail-section"><h3>関連タスク <span class="count-badge">${related.length}</span></h3>${related.map(t=>`<button class="detail-task" data-task="${t.id}">${escapeHTML(t.title)}${statusPill(t.status)}</button>`).join('')}</div>`:''}<p class="footnote">背景には提供資料の仮説・前提を含みます。</p>`;
  }
  function openDetail(id){if(!nx.has(id))return;if(!$('detailDialog').open)returnFocus=document.activeElement;state.selectedId=id;renderMap();renderDetail();if(!$('detailDialog').open)$('detailDialog').showModal();}
  function closeDetail(){const d=$('detailDialog');if(d.open)d.close();}
  function updateTask(id,status){const t=taskById(id);if(!t||!STATUS_ORDER.includes(status)||t.status===status)return;t.status=status;state.updatedAt=new Date().toISOString();const saved=persist();const focusId=document.activeElement?.id;renderAll();if($('detailDialog').open){renderDetail();if(focusId&&$(focusId))$(focusId).focus();}notify(saved?`「${STATUS_LABELS[status]}」に更新しました`:'進捗を更新しましたが、ブラウザに保存できませんでした');}
  function renderPlanner(){
    $('plannerMonth').innerHTML=OPTIONS.map(([y,m])=>`<option value="${ym(y,m)}" ${state.selectedMonth===ym(y,m)?'selected':''}>${y}年${m}月</option>`).join('');
    const chosen=state.selectedMonth,start=chosen-6,slack=start-NOW;
    $('plannerResult').className=`planner-result ${slack<=1?'warning':''}`;
    $('plannerResult').textContent=slack<0?`標準6か月では、${fmt(fromIdx(start))}の合意を想定する日程です。工程の見直しが必要です。`:slack===0?'標準6か月で進めるには、今月中の導入合意が必要です。':`標準6か月では、合意の目安まであと${slack}か月です。`;
    const first=chosen+1,o=fromIdx(first),apply=ym(o.m>6?o.y+1:o.y,9);
    $('plannerSummaries').innerHTML=`<div><span>導入合意の目安</span><strong>${fmt(fromIdx(start))}</strong></div><div><span>新保険料適用の想定</span><strong>${fmt(fromIdx(apply))}</strong></div><div><span>会社のCF実現の想定</span><strong>${fmt(fromIdx(apply+1))}</strong></div><p class="footnote">${o.m<=4?'4〜6月の算定対象期間全体への反映を想定。':o.m<=6?'4〜6月の一部への反映を想定。削減額は対象月数により変わります。':'初回給与が7月以降のため、翌年の定時決定を想定。'}</p>`;
    $('plannerSteps').innerHTML=STEPS.map(([off,title])=>{const month=chosen+off;return `<div class="planner-step ${month<NOW?'past':''}"><time>${fromIdx(month).y}.${String(fromIdx(month).m).padStart(2,'0')}</time><span>${escapeHTML(title)}</span></div>`;}).join('');
  }
  function renderGantt(){
    let h='<div class="gh gl" style="grid-row:1;grid-column:1">取り組み / 予定</div>';
    MONTHS.forEach((m,i)=>{const now=ym(m.y,m.m)===NOW;h+=`<div class="gh ${now?'now':''}" style="grid-row:1;grid-column:${i+2}">${i===0||m.m===1?`<span class="year">${m.y}</span>`:''}${m.l}${now?' · 今月':''}</div>`;});
    GANTT_ROWS.forEach((r,ri)=>{const row=ri+2;h+=`<div class="gl" style="grid-row:${row};grid-column:1">${r.l}</div>`;MONTHS.forEach((m,i)=>h+=`<div class="gc ${ym(m.y,m.m)===NOW?'now':''}" style="grid-row:${row};grid-column:${i+2}"></div>`);(r.b||[]).forEach(([s,e,c,t])=>h+=`<div class="gbar ${c}" title="${escapeHTML(t)}" style="grid-row:${row};grid-column:${s+2}/${e+2}">${escapeHTML(t)}</div>`);(r.f||[]).forEach(([c,t])=>h+=`<div class="gflag" style="grid-row:${row};grid-column:${c+2}">${escapeHTML(t)}</div>`);});
    $('masterGantt').innerHTML=h;
  }
  function renderAll(){renderOverview();renderBoard();renderMap();renderPlanner();renderGantt();}
  function route(){const aliases={planner:'schedule',gantt:'schedule',kanban:'tasks',simulator:'schedule'},hash=location.hash.slice(1),view=aliases[hash]||hash;state.view=['overview','tasks','schedule','map'].includes(view)?view:'overview';document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==`view-${state.view}`);document.querySelectorAll('[data-view]').forEach(el=>{const active=el.dataset.view===state.view;el.classList.toggle('is-active',active);if(active){el.setAttribute('aria-current','page');$('breadcrumb').textContent=el.textContent.replace(/\d+$/,'').trim();}else el.removeAttribute('aria-current');});document.title=`${({overview:'プロジェクトの現在地',tasks:'タスクボード',schedule:'スケジュール',map:'判断の背景'})[state.view]} | 選択制DC`;}
  document.addEventListener('click',e=>{if(e.target.closest('.skip-link')){e.preventDefault();$('main').focus();$('main').scrollIntoView();return;}const task=e.target.closest('[data-task]'),node=e.target.closest('[data-node]'),complete=e.target.closest('[data-complete]'),filter=e.target.closest('[data-track]'),link=e.target.closest('[data-track-link]');if(task)openDetail(task.dataset.task);else if(node)openDetail(node.dataset.node);else if(complete)updateTask(complete.dataset.complete,'done');else if(filter){state.filter=filter.dataset.track;renderBoard();}else if(link){state.filter=link.dataset.trackLink;renderBoard();}});
  $('detailDialog').addEventListener('change',e=>{if(e.target.id==='taskStatus')updateTask(state.selectedId,e.target.value);});
  $('closeDetail').addEventListener('click',closeDetail);
  $('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog')){const box=e.target.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)closeDetail();}});
  $('detailDialog').addEventListener('close',()=>{if(returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus();else{const returnId=returnFocus?.dataset.task||returnFocus?.dataset.node||state.selectedId;const fallback=[...document.querySelectorAll(`[data-task="${returnId}"], [data-node="${returnId}"]`)].find(el=>!el.closest('[hidden]')&&!el.closest('dialog'));if(fallback)fallback.focus();else $('main').focus();}});
  $('clearMap').addEventListener('click',()=>{state.selectedId=null;renderMap();});
  $('plannerMonth').addEventListener('change',e=>{const value=Number(e.target.value);if(!OPTIONS.some(([y,m])=>ym(y,m)===value))return;state.selectedMonth=value;persist();renderPlanner();renderOverview();if(state.saveFailed)notify('比較条件を保存できませんでした');});
  $('resetBoardBtn').addEventListener('click',()=>$('resetDialog').showModal());
  $('cancelReset').addEventListener('click',()=>$('resetDialog').close());
  $('confirmReset').addEventListener('click',()=>{state.tasks=seedTasks();state.updatedAt=null;state.imported=false;state.selectedId=null;const saved=persist();$('resetDialog').close();renderAll();notify(saved?'初期状態に戻しました':'初期状態に戻しましたが、保存できませんでした');});
  $('kanbanBoard').addEventListener('dragstart',e=>{const card=e.target.closest('[data-task]');if(card){e.dataTransfer.setData('text/plain',card.dataset.task);e.dataTransfer.effectAllowed='move';}});
  $('kanbanBoard').addEventListener('dragover',e=>{const col=e.target.closest('[data-status]');if(col){e.preventDefault();e.dataTransfer.dropEffect='move';col.classList.add('is-over');}});
  $('kanbanBoard').addEventListener('dragleave',e=>{const col=e.target.closest('[data-status]');if(col&&!col.contains(e.relatedTarget))col.classList.remove('is-over');});
  $('kanbanBoard').addEventListener('drop',e=>{const col=e.target.closest('[data-status]');if(!col)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain');col.classList.remove('is-over');updateTask(id,col.dataset.status);});
  $('kanbanBoard').addEventListener('dragend',()=>document.querySelectorAll('.is-over').forEach(el=>el.classList.remove('is-over')));
  window.addEventListener('hashchange',()=>{closeDetail();route();window.scrollTo({top:0,behavior:'instant'});$('main').focus({preventScroll:true});});
  window.addEventListener('storage',e=>{if(e.key===TASK_KEY){const incoming=loadState();Object.assign(state,incoming);renderAll();if($('detailDialog').open)renderDetail();}});
  $('todayLabel').textContent=TODAY.toLocaleDateString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'});
  renderAll();route();
  if(state.storageWarning)notify('保存データを読み込めなかったため、初期状態を表示しています');
})();
