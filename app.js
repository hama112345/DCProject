
(() => {
  "use strict";

  const STORAGE_KEY = "dc-dashboard-prototype-v2";
  const CONTENT_KEY = "dc-dashboard-content-v1";
  const emptyC = () => ({texts:{},tasks:{},hidden:[]});
  let SHARED = emptyC();          // content.json（みんなに見える内容）
  let DRAFT  = emptyC();          // この端末だけの未書き出し編集
  let C      = emptyC();          // 表示に使う合成結果
  const DEFAULTS = {};            // 画面に元から書いてある文言
  function mergeContent(){
    const tasks={};
    [SHARED.tasks||{},DRAFT.tasks||{}].forEach(src=>Object.entries(src).forEach(([id,v])=>{tasks[id]={...(tasks[id]||{}),...(v||{})};}));
    C={texts:{...(SHARED.texts||{}),...(DRAFT.texts||{})},tasks,
       hidden:[...new Set([...(SHARED.hidden||[]),...(DRAFT.hidden||[])])],
       updatedAt:SHARED.updatedAt||null,updatedBy:SHARED.updatedBy||'',note:SHARED.note||''};
  }
  const T  = (k,f) => typeof C.texts[k]==='string' ? C.texts[k] : f;
  const ED = k => ` data-ed="${k}"`;
  const nl2br = v => String(v).replace(/\n/g,'<br>');
  function loadDraft(){
    try{const raw=localStorage.getItem(CONTENT_KEY);if(!raw)return;const j=JSON.parse(raw);
      if(j&&typeof j==='object')DRAFT={texts:j.texts||{},tasks:j.tasks||{},hidden:Array.isArray(j.hidden)?j.hidden:[]};}catch{}
  }
  function saveDraft(){try{localStorage.setItem(CONTENT_KEY,JSON.stringify(DRAFT));return true;}catch{return false;}}
  const draftCount = () => Object.keys(DRAFT.texts).length+Object.keys(DRAFT.tasks).length+DRAFT.hidden.length;
  function setText(key,value){
    const base = typeof (SHARED.texts||{})[key]==='string' ? SHARED.texts[key] : (key in DEFAULTS ? DEFAULTS[key] : undefined);
    if(value===base) delete DRAFT.texts[key]; else DRAFT.texts[key]=value;
    mergeContent();saveDraft();refreshEditBar();
  }
  function setTaskField(id,field,value){
    const t=DRAFT.tasks[id]||(DRAFT.tasks[id]={});
    t[field]=value;mergeContent();saveDraft();refreshEditBar();
  }
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

    {id:"q1", L:"q", cd:"Q1 収益", t:"固定料金の水準と、研修の扱いをどう決めるか", nt:"9/8に規模レンジ別の固定料金で確定（削減額連動の成果報酬は不採用）。残る論点は金額水準と、研修を料金に含めるか別建てにするか。", up:["g1","g3"]},
    {id:"q3", L:"q", cd:"Q3 対象", t:"どの規模・どの層に提案するか", nt:"50名が一つの基準。50名以上は導入単体で採算、50名未満は顧問契約への入口。八十二DCも50名以上（または会社拠出30万円/月以上）のみが対象。", up:["g2","g3"]},
    {id:"q5", L:"q", cd:"Q5 リスク", t:"説明責任と保険営業をどう両立させるか", nt:"給付影響の説明は事業主の義務。個別営業は収益源だが利益相反を生む。", up:["g1"]},
    {id:"q6", L:"q", cd:"Q6 資金", t:"請求までの先行工数をどう持ちこたえるか", nt:"固定料金になり、請求は会社のCF実現（合意から13か月）と切り離された。ただし合意から施行までの約6か月は自社工数が先行する。", up:["g3"]},

    {id:"h1", L:"h", cd:"H1", t:"固定料金＋継続支援なら小規模でも成立する", nt:"50名未満は導入フィーを薄くし、年次説明会・JFC顧問契約・退職金上乗せで回収する。金額案は提示済み・未確定。", up:["q1","q6"]},
    {id:"h3", L:"h", cd:"H3", t:"既存の保険取引先が最初の1社になる", nt:"9月合意に間に合うのは、すでに関係がある先だけ。規程の開示も含めて話が早い。", up:["q3"]},
    {id:"h7", L:"h", cd:"H7", t:"投資教育を軸に月額収益化できる", nt:"義務として発生する教育を、有償の運用支援メニューに束ねる。", up:["q1"]},
    {id:"h8", L:"h", cd:"H8", t:"製造業を主軸に、建設・宿泊を組み合わせる", nt:"製造は母数と給与水準で最有力。建設は経審の切り口があるが母数が小さく個別訪問向き。宿泊は県内資本で規模のある先が限られる。配分案は提示済み・承認待ち。", up:["q3"]},
    {id:"h10", L:"h", cd:"H10", t:"設計から定着までの伴走が、価格差の根拠になる", nt:"SBIは説明会・投資教育がオプション。八十二は50名未満を扱わない。制度を入れて終わりにせず運用に乗せる点を差別化の軸にする。", up:["q1"]},
    {id:"h9", L:"h", cd:"H9", t:"説明会ルールを標準化しないと案件化後に止まる", nt:"説明責任、最低賃金、社労士との線引きを整えないと実務上の停止要因になる。", up:["q5"]},

    {id:"e1", L:"e", cd:"E1", t:"委託契約の報酬体系を確認する", nt:"導入時・継続それぞれの取り分を契約書と担当者への確認で明確にする。", up:["h1"]},
    {id:"e4", L:"e", cd:"E4", t:"DMを発出し反応率を測る", nt:"300社に発出（9月中〜10月上旬）。反応率1〜3%を想定。導入の直接獲得か説明会への集客か、目的を先に決める。", up:["h3"]},
    {id:"e6", L:"e", cd:"E6", t:"説明会と保険提案の運用ルールを整える", nt:"時間分離、同意書、記録方法、担当分離。コンプライアンス確認を通す。", up:["h9"]},
    {id:"e7", L:"e", cd:"E7", t:"第1号で実稼働時間を実測する", nt:"提案から施行までの自社工数を記録し、損益分岐の前提を確定させる。", up:["h7","h1"]},
    {id:"e8", L:"e", cd:"E8", t:"候補業界を比較し優先順位を決める", nt:"従業員規模、給与水準、退職金ニーズ、採用・定着課題、制度導入余力で比較する。", up:["h8"]},

    {id:"e9", L:"e", cd:"E9", t:"営業資料を2段の営業フローで使える形にする", nt:"1段＝試算データを出してもらう、2段＝導入を決めてもらう。ダイジェスト版・試算版・チラシを揃える。", up:["h10"]},
    {id:"e10", L:"e", cd:"E10", t:"運営管理機関と競合の条件を比較する", nt:"八十二・SBI・アクサ・FDCJの費用と対象規模を並べ、規模別の振り分けと価格の根拠にする。", up:["h10","h1"]},
    {id:"e11", L:"e", cd:"E11", t:"11/30説明会で案件化の導線を検証する", nt:"50社想定。参加企業を個別提案につなげる流れを確かめる。", up:["h3","h8"]},

    {id:"t1", L:"t", t:"委託契約書の報酬条項を読む", nt:"導入時・継続の報酬条項を確認する。", up:["e1"], due:"8月中"},
    {id:"t2", L:"t", t:"代表事業主に収益条件を確認する", nt:"実際の受取条件を確認する。", up:["e1"], due:"8月中"},
    {id:"t3", L:"t", t:"報酬3案を比較し1案に決める", nt:"9/8の戦略会議で、規模レンジ別の固定料金に決定。", up:["e1"], due:"9月上旬"},
    {id:"t4", L:"t", t:"10社想定の資金繰り表を作る", nt:"固定料金・導入後請求の前提で、合意から請求までの先行工数と入金時期を見積もる。", up:["h1"], due:"9月上旬"},
    {id:"t5", L:"t", t:"DM原稿の限度額の誤りを直す", nt:"2万3千円から6万2千円へ、という誤記を修正する。", up:["e4"], due:"8月中"},
    {id:"t6", L:"t", t:"DMを300社に発送する", nt:"9月中〜10月上旬に送付し、先行接触へ進む。11/30説明会の集客から逆算した期限。", up:["e4"], due:"10月上旬"},
    {id:"t7", L:"t", t:"本命2〜3社を選定する", nt:"今から合意できる候補を絞る。", up:["e4"], due:"8月中"},
    {id:"t8", L:"t", t:"等級ベースの試算表を作る", nt:"シミュレータで対応済み。アクサ資料の試算と1円単位で一致を確認。", up:["e7"], due:"9月上旬"},
    {id:"t10", L:"t", t:"説明会ルールを文書化する", nt:"説明会と保険提案を分けるルールを整える。", up:["e6"], due:"9月中"},
    {id:"t11", L:"t", t:"会社向け同意書のひな形を作る", nt:"説明と同意の標準文書を用意する。", up:["e6"], due:"9月中"},
    {id:"t12", L:"t", t:"社労士の連携先を確保する", nt:"規程変更と説明監修の両方で必要。", up:["e6","e7"], due:"9月中"},
    {id:"t13", L:"t", t:"稼働時間の記録フォーマットを作る", nt:"第1号で工数を実測できるようにする。", up:["e7"], due:"9月中"},
    {id:"t14", L:"t", t:"宿泊・観光業以外のターゲット業界を決める", nt:"製造・建設・宿泊の3業種、製造主軸で提案済み。承認待ち。", up:["e8"], due:"9月中"},
    {id:"t15", L:"t", t:"DMの目的と業種配分を確定する", nt:"導入の直接獲得か、説明会への集客か。配分案は製造180・建設90・宿泊30で提示済み。", up:["e4","e8"], due:"9月中"},
    {id:"t16", L:"t", t:"DM送付先リストを入手する", nt:"売上10〜20億円規模・県内資本の企業を抽出する。入手元と費用を決める。", up:["e4"], due:"9月中"},
    {id:"t17", L:"t", t:"DM原稿と同封物を仕上げる", nt:"A4チラシの流用可否、問い合わせの受け皿、反応の記録方法まで決める。", up:["e4"], due:"9月中"},
    {id:"t18", L:"t", t:"価格表の金額と研修の扱いを確定する", nt:"規模レンジ別の金額を決める。研修を料金に含めるか、別建てで残すかを先に決める。", up:["e10"], due:"9月中", ow:"浜西"},
    {id:"t19", L:"t", t:"営業資料を精査しデザイン化する", nt:"ダイジェスト版・試算版のたたきを9/15に提出済み。精査のうえデザインを依頼する。", up:["e9"], due:"9月中", ow:"高野部長・浜西"},
    {id:"t20", L:"t", t:"A4チラシを仕上げる", nt:"担当者止まりの面談で託す1枚。試算数字はアクサ資料に合わせる。", up:["e9"], due:"9月中"},
    {id:"t21", L:"t", t:"運管・競合の費用比較表を作る", nt:"八十二・SBI・アクサ・FDCJ。SBIのプラン管理料は月額／年額の単位を確認する。UFJ・メガバンクは調査中。", up:["e10"], due:"9月中", ow:"浜西"},
    {id:"t22", L:"t", t:"経審の加点対象になるかを確認する", nt:"建設業向けの訴求の核。W点（社会性等）で選択制でも加点されるかを確かめる。", up:["e8"], due:"9月中", ow:"浜西"},
    {id:"t23", L:"t", t:"アクサに中小企業の導入事例を依頼する", nt:"公開情報の事例は簡素なものしかない。ダイジェスト版の事例ページに使う。", up:["e9"], due:"9月中"},
    {id:"t24", L:"t", t:"11/30説明会の集客・登壇・資料を準備する", nt:"50社想定、3名のジョイント形式。投影資料は中立性を担保した体裁にする。", up:["e11"], due:"11月中"}
  ];

  const TASK_SEED = {
    t1: { status:"done" }, t2:{ status:"review" }, t3:{ status:"done" }, t4:{ status:"todo" },
    t5:{ status:"done" }, t6:{ status:"todo" }, t7:{ status:"backlog" }, t8:{ status:"done" },
    t10:{ status:"todo" }, t11:{ status:"todo" }, t12:{ status:"review" }, t13:{ status:"todo" }, t14:{ status:"review" },
    t15:{ status:"review" }, t16:{ status:"todo" }, t17:{ status:"todo" }, t18:{ status:"doing" }, t19:{ status:"doing" },
    t20:{ status:"todo" }, t21:{ status:"doing" }, t22:{ status:"todo" }, t23:{ status:"todo" }, t24:{ status:"todo" }
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
    {l:"DM・営業",w:"j",wt:"自社",b:[[1,15,"j","DM発出（〜10月上旬）→ 先行接触 → 面談 → 提案（継続）"]]},
    {l:"11/30 説明会",w:"j",wt:"自社",b:[[1,4,"j","集客 → 資料準備"]],f:[[3,"11/30 説明会","a"]]},
    {l:"第1号 導入工程",w:"u",wt:"案件",b:[[1,7,"u","規程整備 → 規約申請 → 厚生局審査 → 加入者登録"]],f:[[7,"3月 施行","a"]]},
    {l:"第1号 社会保険",w:"k",wt:"手続",b:[[8,11,"k","4〜6月支払分が算定基礎"]],f:[[11,"算定基礎届","a"],[13,"9月 等級改定",""]]},
    {l:"削減の実現",w:"c",wt:"CF",f:[[12,"8月 通知書","g"],[14,"10月 CF実現","g"]]},
    {l:"報酬の請求",w:"c",wt:"収益",b:[[8,10,"c","固定料金を導入後に請求"]]},
    {l:"第2号（11月合意）",w:"u",wt:"案件",b:[[3,9,"u","導入工程"]],f:[[9,"5月 施行","a"]]},
    {l:"継続支援",w:"j",wt:"自社",b:[[7,15,"s","投資教育・フォロー・顧問提案"]]}
  ];

  const TRACKS = [
    {id:'preparation',title:'事業準備',icon:'01',period:'8〜10月',description:'価格・試算・説明ルールを揃え、提案できる状態にする。',ids:['t1','t2','t3','t4','t8','t10','t11','t12','t13','t18','t21','t22']},
    {id:'sales',title:'営業・候補企業の開拓',icon:'02',period:'9月〜',description:'営業資料とDMを整え、個別提案と11/30説明会から最初の合意につなげる。',ids:['t5','t6','t7','t14','t15','t16','t17','t19','t20','t23','t24']}
  ];
  const SL = s => T('status.'+s, STATUS_LABELS[s]);
  const LL = k => T('level.'+k, LEVEL_LABELS[k]);
  const TRK = (t,f) => T('track.'+t.id+'.'+f, t[f]);
  const TODAY = new Date();
  const TODAY_START = new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()).getTime();
  const TASK_KEY = 'dc-dashboard-v3';
  const $ = id => document.getElementById(id);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let ALL_NODES = [], nx = new Map(), children = new Map();
  function buildNodes(){
    const extra = Object.entries(C.tasks)
      .filter(([id,v]) => v && v.isNew && !NODES.some(n=>n.id===id))
      .map(([id,v]) => ({id,L:'t',t:v.title||'新しいタスク',nt:v.description||'',up:[],due:v.due||'',ow:v.owner||''}));
    ALL_NODES = NODES.concat(extra)
      .filter(n => !C.hidden.includes(n.id))
      .map(n => {
        if(n.L!=='t') return {...n, t:T('node.'+n.id+'.t',n.t), nt:T('node.'+n.id+'.nt',n.nt)};
        const o=C.tasks[n.id]||{};
        return {...n, t:typeof o.title==='string'?o.title:n.t,
                      nt:typeof o.description==='string'?o.description:n.nt,
                      due:typeof o.due==='string'?o.due:(n.due||''),
                      ow:typeof o.owner==='string'?o.owner:(n.ow||'')};
      });
    nx = new Map(ALL_NODES.map(n => [n.id,n]));
    children = new Map(ALL_NODES.map(n => [n.id,[]]));
    ALL_NODES.forEach(n => (n.up || []).forEach(p => children.get(p)?.push(n.id)));
  }
  loadDraft(); mergeContent(); buildNodes();
  let BOARD = null; // board.json（共有の進捗）。リポジトリ側で更新すれば全員の画面に反映される
  const seedTasks = () => ALL_NODES.filter(n=>n.L==='t').map(n=>{
    const o=C.tasks[n.id]||{};
    const task={id:n.id,title:n.t,description:n.nt,due:n.due||'',owner:n.ow||'',status:TASK_SEED[n.id]?.status || 'todo',track:TRACKS.find(t=>t.ids.includes(n.id))?.id || 'preparation'};
    const row=BOARD?.tasks?.find(r=>r?.id===n.id);
    if(row){if(STATUS_ORDER.includes(row.status))task.status=row.status;if(typeof row.owner==='string'&&row.owner)task.owner=row.owner;if(typeof row.due==='string'&&row.due)task.due=row.due;}
    if(STATUS_ORDER.includes(o.status))task.status=o.status;
    if(TRACKS.some(t=>t.id===o.track))task.track=o.track;
    return task;
  });
  function loadState(){
    const base = {tasks:seedTasks(),updatedAt:null,selectedMonth:ym(2027,3),saveFailed:false,source:BOARD?'board':'seed',imported:false};
    try {
      const raw = localStorage.getItem(TASK_KEY) || localStorage.getItem(STORAGE_KEY);
      if(!raw) return base;
      const parsed = JSON.parse(raw), saved = Array.isArray(parsed) ? parsed : parsed?.tasks;
      if(!Array.isArray(saved)) return base;
      if(OPTIONS.some(([y,m])=>ym(y,m)===parsed.selectedMonth))base.selectedMonth=parsed.selectedMonth;
      // 共有の進捗のほうが新しければ、この端末の古い変更は使わない
      const localAt=typeof parsed.updatedAt==='string'?Date.parse(parsed.updatedAt):NaN, boardAt=BOARD?.updatedAt?Date.parse(BOARD.updatedAt):NaN;
      if(BOARD && !(localAt>boardAt)) return base;
      base.source='local';
      base.tasks.forEach(task=>{const row=saved.find(t=>t?.id===task.id);if(row && STATUS_ORDER.includes(row.status))task.status=row.status;});
      base.updatedAt=typeof parsed.updatedAt==='string' && !Number.isNaN(Date.parse(parsed.updatedAt)) ? parsed.updatedAt : null;
      base.imported = Array.isArray(parsed) || parsed.imported === true;
      if(OPTIONS.some(([y,m])=>ym(y,m)===parsed.selectedMonth))base.selectedMonth=parsed.selectedMonth;
    } catch {base.storageWarning=true;}
    return base;
  }
  const state = {...loadState(),selectedId:null,filter:'all',view:'overview',edit:false};
  let toastTimer, returnFocus;
  function notify(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3000);}
  function persist(){
    try {localStorage.setItem(TASK_KEY,JSON.stringify({tasks:state.tasks.map(({id,status})=>({id,status})),updatedAt:state.updatedAt,selectedMonth:state.selectedMonth,imported:!!state.imported}));state.saveFailed=false;return true;}
    catch {state.saveFailed=true;return false;}
  }
  const taskById = id => state.tasks.find(t=>t.id===id);
  const trackById = id => TRACKS.find(t=>t.id===id) || TRACKS[0];
  function dueBoundary(task){const month=Number(String(task.due||'').match(/(\d+)月/)?.[1]);if(!month)return Infinity;return task.due.includes('上旬') ? new Date(2026,month-1,10).getTime() : new Date(2026,month,0).getTime();}
  const overdue = task => task.status !== 'done' && dueBoundary(task) < TODAY_START;
  function priorityTasks(tasks=state.tasks){const rank={review:0,doing:1,todo:2,backlog:3,done:4};return tasks.filter(t=>t.status!=='done').sort((a,b)=>dueBoundary(a)-dueBoundary(b) || rank[a.status]-rank[b.status] || Number(a.id.slice(1))-Number(b.id.slice(1)));}
  function ancestors(id,seen=new Set()){(nx.get(id)?.up||[]).forEach(p=>{if(!seen.has(p)){seen.add(p);ancestors(p,seen);}});return seen;}
  function descendants(id,seen=new Set()){(children.get(id)||[]).forEach(c=>{if(!seen.has(c)){seen.add(c);descendants(c,seen);}});return seen;}
  function statusPill(status){return `<span class="pill ${status}">${SL(status)}</span>`;}
  function dueLabel(task){return `<span class="${overdue(task)?'due-alert':''}">${task.due}${overdue(task)?' · 期限超過':''}</span>`;}
  function renderOverview(){
    const done=state.tasks.filter(t=>t.status==='done').length,total=state.tasks.length;
    const active=state.tasks.filter(t=>['doing','review'].includes(t.status)).length;
    const late=state.tasks.filter(overdue).length,pct=Math.round(done/total*100);
    $('navTaskCount').textContent=total-done;
    $('metrics').innerHTML=`<article class="metric"><div class="metric-label"><span${ED('metric.1.label')}>${escapeHTML(T('metric.1.label','登録タスクの完了'))}</span><span>${pct}%</span></div><div class="metric-value">${done}<span class="slash-count"> / ${total}</span><small>件</small></div><div class="progress" role="progressbar" aria-label="登録タスクの完了率" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${pct}%"></span></div></article><article class="metric"><div class="metric-label"${ED('metric.2.label')}>${escapeHTML(T('metric.2.label','進行中・確認待ち'))}</div><div class="metric-value">${active}<small>件</small></div><p class="metric-note">${escapeHTML(SL('doing'))} ${state.tasks.filter(t=>t.status==='doing').length} · ${escapeHTML(SL('review'))} ${state.tasks.filter(t=>t.status==='review').length}</p></article><article class="metric ${late?'alert':''}"><div class="metric-label"><span${ED('metric.3.label')}>${escapeHTML(T('metric.3.label','期限を過ぎた未完了'))}</span><b>要確認</b></div><div class="metric-value">${late}<small>件</small></div><p class="metric-note">${late?'期日の見直し・完了確認が必要':'期限超過のタスクはありません'}</p></article><article class="metric"><div class="metric-label"${ED('metric.4.label')}>${escapeHTML(T('metric.4.label','次の節目 · 導入合意'))}</div><div class="metric-value date-value"><span${ED('metric.4.value')}>${escapeHTML(T('metric.4.value','2026.09'))}</span><small${ED('metric.4.unit')}>${escapeHTML(T('metric.4.unit','月中'))}</small></div><p class="metric-note"${ED('metric.4.note')}>${escapeHTML(T('metric.4.note','合意実績は未登録'))}</p></article>`;
    const stages=[{title:'準備・合意',time:'2026.08 — 09',start:ym(2026,8),end:ym(2026,9)},{title:'導入手続き',time:'2026.10 — 2027.02',start:ym(2026,10),end:ym(2027,2)},{title:'第1号施行',time:'2027.03',start:ym(2027,3),end:ym(2027,3)},{title:'検証・継続支援',time:'2027.04 —',start:ym(2027,4),end:Infinity}];
    $('journey').innerHTML=stages.map((s,i)=>{const current=NOW>=s.start&&NOW<=s.end;return `<div class="journey-step ${current?'current':''}"><span class="step-number">${String(i+1).padStart(2,'0')}</span><h3${ED('stage.'+i+'.title')}>${escapeHTML(T('stage.'+i+'.title',s.title))}</h3><p${ED('stage.'+i+'.time')}>${escapeHTML(T('stage.'+i+'.time',s.time))}</p><small>${current?'計画上の現在地':NOW>s.end?'実績未登録':'予定'}</small></div>`;}).join('');
    const next=priorityTasks().slice(0,3);
    $('nextCount').textContent=`${next.length}件`;
    $('nextActions').innerHTML=next.length?next.map((t,i)=>`<button class="action-row" data-task="${t.id}"><span class="action-number">${i+1}</span><span class="action-body"><span class="action-title">${escapeHTML(t.title)}</span><span class="action-meta">${statusPill(t.status)}${dueLabel(t)}</span></span><span class="action-arrow" aria-hidden="true">↗</span></button>`).join(''):'<div class="empty-state">登録タスクはすべて完了しています。<br>次の工程の計画を確認しましょう。</div>';
    $('trackCards').innerHTML=TRACKS.map(track=>{const tasks=state.tasks.filter(t=>t.track===track.id),count=tasks.filter(t=>t.status==='done').length,nextTask=priorityTasks(tasks)[0];return `<article class="track-card ${track.id}"><div class="track-heading"><span class="track-icon">${track.icon}</span><h3${ED('track.'+track.id+'.title')}>${escapeHTML(TRK(track,'title'))}</h3><small${ED('track.'+track.id+'.period')}>${escapeHTML(TRK(track,'period'))}</small></div><p class="track-description"${ED('track.'+track.id+'.description')}>${escapeHTML(TRK(track,'description'))}</p><div class="track-count"><span>登録タスクの完了</span><strong>${count}<span> / ${tasks.length}</span></strong></div><div class="progress" role="progressbar" aria-label="タスク完了率" aria-valuenow="${tasks.length?Math.round(count/tasks.length*100):0}" aria-valuemin="0" aria-valuemax="100"><span style="width:${tasks.length?count/tasks.length*100:0}%"></span></div><div class="track-next"><small>次に進めること</small>${nextTask?`<button data-task="${nextTask.id}">${escapeHTML(nextTask.title)} <span aria-hidden="true">↗</span></button>`:'登録タスクはすべて完了'}<a class="text-link" href="#tasks" data-track-link="${track.id}">関連タスクを見る →</a></div></article>`;}).join('')+`<article class="track-card delivery"><div class="track-heading"><span class="track-icon">03</span><h3${ED('track.delivery.title')}>${escapeHTML(T('track.delivery.title','第1号案件の導入'))}</h3><small${ED('track.delivery.period')}>${escapeHTML(T('track.delivery.period','9月〜翌3月'))}</small></div><p class="track-description"${ED('track.delivery.description')}>${escapeHTML(T('track.delivery.description','合意から規程整備・審査・説明会を経て、制度をスタートする。'))}</p><div class="track-count"><span>実績の登録状況</span><strong style="font-size:.9375rem">進捗未登録</strong></div><div class="progress"></div><div class="track-next"><small>次の節目</small><span${ED('track.delivery.next')}>${escapeHTML(T('track.delivery.next','9月中に導入合意'))}</span><a class="text-link" href="#schedule">導入の計画を確認 →</a></div></article>`;
    const changed=state.source==='local'&&(state.updatedAt||state.imported);
    const stamp=v=>new Date(v).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const dc=draftCount(),SRC=SHARED.updatedAt?SHARED:BOARD;
    $('dataMode').textContent=dc?'この端末で編集中':changed?'この端末で変更中':(SHARED.updatedAt||BOARD)?'共有の進捗':'初期状態';
    $('dataDescription').textContent=dc?`未書き出しの編集 ${dc}件 · 下のバーから content.json を書き出すと全員に反映されます`:changed?(state.updatedAt?`最終更新 ${new Date(state.updatedAt).toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})} · このブラウザの進捗を反映`:'このブラウザに保存されていた進捗を引き継いでいます。'):SRC?`最終更新 ${SRC.updatedAt?stamp(SRC.updatedAt):'—'}${SRC.updatedBy?' · '+SRC.updatedBy:''}${SRC.note?' · '+SRC.note:''}`:'共有の進捗を読み込めなかったため、初期状態を表示しています。';
    $('saveLabel').textContent=state.saveFailed?'未保存 · この画面のみ反映':'このブラウザに保存';
    $('saveLabel').classList.toggle('due-alert',state.saveFailed);
  }
  function renderBoard(){
    const filtered=state.tasks.filter(t=>state.filter==='all'||t.track===state.filter);
    $('kanbanBoard').innerHTML=STATUS_ORDER.map(status=>{const tasks=filtered.filter(t=>t.status===status);return `<section class="kanban-column" data-status="${status}" aria-label="${SL(status)}"><h2 class="kanban-head">${SL(status)}<span>${tasks.length}</span></h2><div class="dropzone" data-dropzone="${status}">${tasks.length?tasks.map(t=>`<button class="task-card" draggable="true" data-task="${t.id}"><span class="task-category">${trackById(t.track).title}</span><strong>${escapeHTML(t.title)}</strong><span class="task-meta">${dueLabel(t)}<span class="task-id">${t.owner?escapeHTML(t.owner)+" · ":""}${t.id.toUpperCase()}</span></span></button>`).join(''):'<div class="empty-state">タスクはありません</div>'}</div></section>`;}).join('');
    $('filterTabs').innerHTML=`<button data-track="all"${ED('tb.filterAll')}>${escapeHTML(T('tb.filterAll','すべて'))}</button>`+TRACKS.map(t=>`<button data-track="${t.id}">${escapeHTML(TRK(t,'title'))}</button>`).join('');
    document.querySelectorAll('[data-track]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.track===state.filter)));
  }
  function renderMap(){
    const active=state.selectedId?new Set([state.selectedId,...ancestors(state.selectedId),...descendants(state.selectedId)]):null;
    $('mapGrid').innerHTML=LAYERS.map(l=>`<div class="map-col"><h2 class="map-col-title"${ED('level.'+l.key)}>${escapeHTML(LL(l.key))}</h2>${ALL_NODES.filter(n=>n.L===l.key).map(n=>`<button class="map-node ${state.selectedId===n.id?'is-active':''} ${active&&!active.has(n.id)?'is-dim':''}" data-node="${n.id}" data-level="${n.L}" aria-pressed="${state.selectedId===n.id}">${n.cd?`<small>${escapeHTML(n.cd)}</small>`:''}${escapeHTML(n.t)}${n.L==='t'?statusPill(taskById(n.id).status):''}</button>`).join('')}</div>`).join('');
  }
  function renderDetail(){
    const node=nx.get(state.selectedId);if(!node)return;
    if(state.edit)return renderDetailEdit(node);
    const task=taskById(node.id);
    const chain=[...ancestors(node.id)].map(id=>nx.get(id)).sort((a,b)=>LAYERS.findIndex(l=>l.key===a.L)-LAYERS.findIndex(l=>l.key===b.L));
    const related=[...descendants(node.id)].map(taskById).filter(Boolean);
    $('detailBody').innerHTML=`<div>${task?statusPill(task.status):`<span class="outline-pill">${LL(node.L)}</span>`}</div><h2 id="detailTitle">${escapeHTML(node.t)}</h2><p class="detail-description">${escapeHTML(node.nt)}</p>${task?`<div class="detail-meta"><div><span class="meta-label">取り組み</span><span>${trackById(task.track).title}</span></div><div><span class="meta-label">期限</span><span>2026年 ${dueLabel(task)}</span></div><div><span class="meta-label">担当者</span><span>${escapeHTML(task.owner||'未設定')}</span></div><div><label for="taskStatus">進捗</label><select id="taskStatus">${STATUS_ORDER.map(s=>`<option value="${s}" ${s===task.status?'selected':''}>${SL(s)}</option>`).join('')}</select></div></div><div class="detail-actions">${task.status!=='done'?`<button class="button primary" data-complete="${task.id}">完了にする ✓</button>`:'<span class="pill done">完了済み</span>'}<a class="button secondary" href="simulator.html">試算を開く ↗</a></div>`:''}${chain.length?`<div class="detail-section"><h3>この取り組みにつながる背景</h3>${chain.map(n=>`<div class="context-item"><small>${LL(n.L)}</small>${escapeHTML(n.t)}</div>`).join('')}</div>`:''}${related.length?`<div class="detail-section"><h3>関連タスク <span class="count-badge">${related.length}</span></h3>${related.map(t=>`<button class="detail-task" data-task="${t.id}">${escapeHTML(t.title)}${statusPill(t.status)}</button>`).join('')}</div>`:''}<p class="footnote">背景には提供資料の仮説・前提を含みます。</p>`;
  }
  function openDetail(id){if(!nx.has(id))return;if(!$('detailDialog').open)returnFocus=document.activeElement;state.selectedId=id;renderMap();renderDetail();if(!$('detailDialog').open)$('detailDialog').showModal();}
  function closeDetail(){const d=$('detailDialog');if(d.open)d.close();}
  function updateTask(id,status){const t=taskById(id);if(!t||!STATUS_ORDER.includes(status)||t.status===status)return;t.status=status;state.updatedAt=new Date().toISOString();state.source='local';const saved=persist();const focusId=document.activeElement?.id;renderAll();if($('detailDialog').open){renderDetail();if(focusId&&$(focusId))$(focusId).focus();}notify(saved?`「${SL(status)}」に更新しました`:'進捗を更新しましたが、ブラウザに保存できませんでした');}
  function renderPlanner(){
    $('plannerMonth').innerHTML=OPTIONS.map(([y,m])=>`<option value="${ym(y,m)}" ${state.selectedMonth===ym(y,m)?'selected':''}>${y}年${m}月</option>`).join('');
    const chosen=state.selectedMonth,start=chosen-6,slack=start-NOW;
    $('plannerResult').className=`planner-result ${slack<=1?'warning':''}`;
    $('plannerResult').textContent=slack<0?`標準6か月では、${fmt(fromIdx(start))}の合意を想定する日程です。工程の見直しが必要です。`:slack===0?'標準6か月で進めるには、今月中の導入合意が必要です。':`標準6か月では、合意の目安まであと${slack}か月です。`;
    const first=chosen+1,o=fromIdx(first),apply=ym(o.m>6?o.y+1:o.y,9);
    $('plannerSummaries').innerHTML=`<div><span${ED('pl.agree')}>${escapeHTML(T('pl.agree','導入合意の目安'))}</span><strong>${fmt(fromIdx(start))}</strong></div><div><span${ED('pl.apply')}>${escapeHTML(T('pl.apply','新保険料適用の想定'))}</span><strong>${fmt(fromIdx(apply))}</strong></div><div><span${ED('pl.cf')}>${escapeHTML(T('pl.cf','会社のCF実現の想定'))}</span><strong>${fmt(fromIdx(apply+1))}</strong></div><p class="footnote">${o.m<=4?'4〜6月の算定対象期間全体への反映を想定。':o.m<=6?'4〜6月の一部への反映を想定。削減額は対象月数により変わります。':'初回給与が7月以降のため、翌年の定時決定を想定。'}</p>`;
    $('plannerSteps').innerHTML=STEPS.map(([off,title],si)=>{const month=chosen+off;return `<div class="planner-step ${month<NOW?'past':''}"><time>${fromIdx(month).y}.${String(fromIdx(month).m).padStart(2,'0')}</time><span${ED('step.'+si)}>${escapeHTML(T('step.'+si,title))}</span></div>`;}).join('');
  }
  function renderGantt(){
    let h='<div class="gh gl" style="grid-row:1;grid-column:1">取り組み / 予定</div>';
    MONTHS.forEach((m,i)=>{const now=ym(m.y,m.m)===NOW;h+=`<div class="gh ${now?'now':''}" style="grid-row:1;grid-column:${i+2}">${i===0||m.m===1?`<span class="year">${m.y}</span>`:''}${m.l}${now?' · 今月':''}</div>`;});
    GANTT_ROWS.forEach((r,ri)=>{const row=ri+2;const kl='gantt.r'+ri+'.l';h+=`<div class="gl" style="grid-row:${row};grid-column:1"${ED(kl)}>${escapeHTML(T(kl,r.l))}</div>`;MONTHS.forEach((m,i)=>h+=`<div class="gc ${ym(m.y,m.m)===NOW?'now':''}" style="grid-row:${row};grid-column:${i+2}"></div>`);(r.b||[]).forEach(([s,e,c,t],bi)=>{const k='gantt.r'+ri+'.b'+bi,v=T(k,t);h+=`<div class="gbar ${c}" title="${escapeHTML(v)}" style="grid-row:${row};grid-column:${s+2}/${e+2}"${ED(k)}>${escapeHTML(v)}</div>`;});(r.f||[]).forEach(([c,t],fi)=>{const k='gantt.r'+ri+'.f'+fi,v=T(k,t);h+=`<div class="gflag" style="grid-row:${row};grid-column:${c+2}"${ED(k)}>${escapeHTML(v)}</div>`;});});
    $('masterGantt').innerHTML=h;
  }
  function renderAll(){renderOverview();renderBoard();renderMap();renderPlanner();renderGantt();applyStaticTexts();applyEditable();}
  function route(){const aliases={planner:'schedule',gantt:'schedule',kanban:'tasks',simulator:'schedule'},hash=location.hash.slice(1),view=aliases[hash]||hash;state.view=['overview','tasks','schedule','map'].includes(view)?view:'overview';document.querySelectorAll('.view').forEach(el=>el.hidden=el.id!==`view-${state.view}`);document.querySelectorAll('[data-view]').forEach(el=>{const active=el.dataset.view===state.view;el.classList.toggle('is-active',active);if(active){el.setAttribute('aria-current','page');$('breadcrumb').textContent=(el.querySelector('[data-nav-label]')?.textContent||el.textContent).replace(/\d+$/,'').trim();}else el.removeAttribute('aria-current');});document.title=`${({overview:'プロジェクトの現在地',tasks:'タスクボード',schedule:'スケジュール',map:'判断の背景'})[state.view]} | 選択制DC`;}
  document.addEventListener('click',e=>{if(e.target.closest('.skip-link')){e.preventDefault();$('main').focus();$('main').scrollIntoView();return;}const task=e.target.closest('[data-task]'),node=e.target.closest('[data-node]'),complete=e.target.closest('[data-complete]'),filter=e.target.closest('[data-track]'),link=e.target.closest('[data-track-link]');if(task)openDetail(task.dataset.task);else if(node)openDetail(node.dataset.node);else if(complete)updateTask(complete.dataset.complete,'done');else if(filter){state.filter=filter.dataset.track;renderBoard();}else if(link){state.filter=link.dataset.trackLink;renderBoard();}});
  $('detailDialog').addEventListener('change',e=>{if(e.target.id==='taskStatus')updateTask(state.selectedId,e.target.value);});
  $('closeDetail').addEventListener('click',closeDetail);
  $('detailDialog').addEventListener('click',e=>{if(e.target===$('detailDialog')){const box=e.target.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)closeDetail();}});
  $('detailDialog').addEventListener('close',()=>{
    if(state.edit){rebuildTasks();renderAll();}if(returnFocus?.isConnected&&!returnFocus.closest('[hidden]'))returnFocus.focus();else{const returnId=returnFocus?.dataset.task||returnFocus?.dataset.node||state.selectedId;const fallback=[...document.querySelectorAll(`[data-task="${returnId}"], [data-node="${returnId}"]`)].find(el=>!el.closest('[hidden]')&&!el.closest('dialog'));if(fallback)fallback.focus();else $('main').focus();}});
  $('clearMap').addEventListener('click',()=>{state.selectedId=null;renderMap();});
  $('plannerMonth').addEventListener('change',e=>{const value=Number(e.target.value);if(!OPTIONS.some(([y,m])=>ym(y,m)===value))return;state.selectedMonth=value;persist();renderPlanner();renderOverview();if(state.saveFailed)notify('比較条件を保存できませんでした');});
  $('resetBoardBtn').addEventListener('click',()=>$('resetDialog').showModal());
  $('cancelReset').addEventListener('click',()=>$('resetDialog').close());
  $('confirmReset').addEventListener('click',()=>{state.tasks=seedTasks();state.updatedAt=null;state.imported=false;state.source=BOARD?'board':'seed';state.selectedId=null;const saved=persist();$('resetDialog').close();renderAll();notify(saved?'共有の進捗に戻しました':'共有の進捗に戻しましたが、保存できませんでした');});
  $('kanbanBoard').addEventListener('dragstart',e=>{const card=e.target.closest('[data-task]');if(card){e.dataTransfer.setData('text/plain',card.dataset.task);e.dataTransfer.effectAllowed='move';}});
  $('kanbanBoard').addEventListener('dragover',e=>{const col=e.target.closest('[data-status]');if(col){e.preventDefault();e.dataTransfer.dropEffect='move';col.classList.add('is-over');}});
  $('kanbanBoard').addEventListener('dragleave',e=>{const col=e.target.closest('[data-status]');if(col&&!col.contains(e.relatedTarget))col.classList.remove('is-over');});
  $('kanbanBoard').addEventListener('drop',e=>{const col=e.target.closest('[data-status]');if(!col)return;e.preventDefault();const id=e.dataTransfer.getData('text/plain');col.classList.remove('is-over');updateTask(id,col.dataset.status);});
  $('kanbanBoard').addEventListener('dragend',()=>document.querySelectorAll('.is-over').forEach(el=>el.classList.remove('is-over')));
  window.addEventListener('hashchange',()=>{closeDetail();route();window.scrollTo({top:0,behavior:'instant'});$('main').focus({preventScroll:true});});
  window.addEventListener('storage',e=>{if(e.key===TASK_KEY){const incoming=loadState();Object.assign(state,incoming);renderAll();if($('detailDialog').open)renderDetail();}});

  /* ===================== 編集モード ===================== */
  function captureDefaults(){
    document.querySelectorAll('[data-ed]').forEach(el=>{
      const k=el.dataset.ed;
      if(!(k in DEFAULTS)) DEFAULTS[k]=el.hasAttribute('data-ed-html')?el.innerText:el.textContent;
    });
  }
  function applyStaticTexts(){
    Object.keys(DEFAULTS).forEach(k=>{
      document.querySelectorAll('[data-ed="'+k+'"]').forEach(el=>{
        const v = typeof C.texts[k]==='string' ? C.texts[k] : DEFAULTS[k];
        if(el.hasAttribute('data-ed-html')){ if(el.innerText!==v) el.innerHTML=nl2br(escapeHTML(v)); }
        else if(el.textContent!==v) el.textContent=v;
      });
    });
  }
  function applyEditable(){
    document.querySelectorAll('[data-ed]').forEach(el=>{
      if(state.edit){el.setAttribute('contenteditable','true');el.setAttribute('spellcheck','false');}
      else el.removeAttribute('contenteditable');
    });
    const add=$('addTaskBtn'); if(add) add.hidden=!state.edit;
  }
  function refreshEditBar(){
    const n=draftCount();
    $('editBar').hidden=!(state.edit||n>0);
    $('editState').textContent=state.edit
      ? (n?`編集中 · 未書き出し ${n}件`:'編集中 · 文字をタップすると直せます')
      : `未書き出しの編集 ${n}件（この端末だけに保存されています）`;
    $('editToggle').textContent=state.edit?'編集を終える':'文言を編集';
    $('editDone').hidden=!state.edit;
  }
  function setEditMode(on){
    state.edit=on;document.body.classList.toggle('editing',on);closeDetail();
    renderAll();refreshEditBar();
    notify(on?'編集モードです。文字をタップすると直せます':'編集モードを終了しました');
  }
  function rebuildTasks(){
    const keep={};state.tasks.forEach(t=>keep[t.id]=t.status);
    buildNodes();state.tasks=seedTasks();
    state.tasks.forEach(t=>{const o=C.tasks[t.id]||{};if(!STATUS_ORDER.includes(o.status)&&keep[t.id])t.status=keep[t.id];});
  }
  /* 文字をタップしたら、リンクを開かずその場で編集する */
  document.addEventListener('click',e=>{
    if(!state.edit)return;
    if(e.target.closest('.edit-bar')||e.target.closest('dialog'))return;
    const el=e.target.closest('[data-ed]');
    if(!el)return;
    e.preventDefault();e.stopPropagation();
    el.focus();
    try{const r=document.createRange();r.selectNodeContents(el);const sel=getSelection();sel.removeAllRanges();sel.addRange(r);sel.collapseToEnd();}catch{}
  },true);
  document.addEventListener('focusout',e=>{
    if(!state.edit)return;
    const el=e.target.closest?.('[data-ed]');
    if(!el||el.getAttribute('contenteditable')!=='true')return;
    const k=el.dataset.ed;
    const v=(el.hasAttribute('data-ed-html')?el.innerText:el.textContent).replace(/\u00a0/g,' ').replace(/\s+$/,'');
    setText(k,v);
    if(/^(track\.|status\.|level\.)/.test(k)){renderAll();}
  });
  /* タスク・ノードの編集フォーム */
  function renderDetailEdit(node){
    const task=taskById(node.id);
    const val=v=>escapeHTML(v??'');
    $('detailBody').innerHTML=`
      <div><span class="outline-pill">${task?'タスクを編集':escapeHTML(LL(node.L))+'を編集'}</span></div>
      <h2 id="detailTitle">${task?'タスクの内容':'文言'}を書きかえる</h2>
      <div class="edit-form">
        <label>見出し<input id="edTitle" type="text" value="${val(node.t)}"></label>
        <label>説明・補足<textarea id="edDesc" rows="4">${val(node.nt)}</textarea></label>
        ${task?`
        <label>期限<input id="edDue" type="text" value="${val(task.due)}" placeholder="例：11月中 / 10月上旬"></label>
        <label>担当<input id="edOwner" type="text" value="${val(task.owner)}" placeholder="例：高野部長・浜西"></label>
        <label>取り組み<select id="edTrack">${TRACKS.map(t=>`<option value="${t.id}" ${t.id===task.track?'selected':''}>${escapeHTML(TRK(t,'title'))}</option>`).join('')}</select></label>
        <label>進捗<select id="edStatus">${STATUS_ORDER.map(st=>`<option value="${st}" ${st===task.status?'selected':''}>${escapeHTML(SL(st))}</option>`).join('')}</select></label>`:''}
      </div>
      ${task?`<div class="detail-actions"><button class="button danger" id="edDelete">このタスクを消す</button></div>`:''}
      <p class="footnote">直した内容はこの端末に保存されます。全員の画面に出すには、下のバーで content.json を書き出してGitHubに置きかえてください。</p>`;
  }
  $('detailDialog').addEventListener('input',e=>{
    if(!state.edit||!state.selectedId)return;
    const id=state.selectedId,node=nx.get(id),v=e.target.value;
    if(e.target.id==='edTitle'){ if(node?.L==='t'){setTaskField(id,'title',v);const t=taskById(id);if(t)t.title=v;} else setText('node.'+id+'.t',v); }
    else if(e.target.id==='edDesc'){ if(node?.L==='t'){setTaskField(id,'description',v);const t=taskById(id);if(t)t.description=v;} else setText('node.'+id+'.nt',v); }
    else if(e.target.id==='edDue'){setTaskField(id,'due',v);const t=taskById(id);if(t)t.due=v;}
    else if(e.target.id==='edOwner'){setTaskField(id,'owner',v);const t=taskById(id);if(t)t.owner=v;}
  });
  $('detailDialog').addEventListener('change',e=>{
    if(!state.edit||!state.selectedId)return;
    const id=state.selectedId;
    if(e.target.id==='edTrack'){setTaskField(id,'track',e.target.value);const t=taskById(id);if(t)t.track=e.target.value;}
    else if(e.target.id==='edStatus'){setTaskField(id,'status',e.target.value);const t=taskById(id);if(t)t.status=e.target.value;}
  });
  $('detailDialog').addEventListener('click',e=>{
    if(e.target.id!=='edDelete')return;
    const id=state.selectedId;
    if(!confirm('このタスクを消しますか？'))return;
    if(C.tasks[id]?.isNew){delete DRAFT.tasks[id];}
    else if(!DRAFT.hidden.includes(id))DRAFT.hidden.push(id);
    mergeContent();saveDraft();closeDetail();rebuildTasks();renderAll();refreshEditBar();
    notify('タスクを消しました');
  });
  function addTask(){
    const id='n'+Date.now().toString(36);
    DRAFT.tasks[id]={isNew:true,title:'新しいタスク',description:'',due:'',owner:'',status:'todo',track:TRACKS.some(t=>t.id===state.filter)?state.filter:TRACKS[0].id};
    mergeContent();saveDraft();rebuildTasks();renderAll();refreshEditBar();openDetail(id);
  }
  /* 書き出し */
  function buildExport(){
    const tasks={};
    Object.entries(C.tasks).forEach(([id,v])=>{tasks[id]={...v};});
    state.tasks.forEach(t=>{
      const base=NODES.find(n=>n.id===t.id),o=tasks[t.id]||{};
      o.status=t.status;
      if(base){
        const defTrack=TRACKS.find(x=>x.ids.includes(t.id))?.id||'preparation';
        if(t.title!==base.t)o.title=t.title; else delete o.title;
        if(t.description!==base.nt)o.description=t.description; else delete o.description;
        if(t.due!==(base.due||''))o.due=t.due; else delete o.due;
        if(t.owner!==(base.ow||''))o.owner=t.owner; else delete o.owner;
        if(t.track!==defTrack)o.track=t.track; else delete o.track;
      }else{
        o.isNew=true;o.title=t.title;o.description=t.description;o.due=t.due;o.owner=t.owner;o.track=t.track;
      }
      tasks[t.id]=o;
    });
    return {updatedAt:new Date().toISOString(),
            updatedBy:($('editBy').value||C.updatedBy||'').trim(),
            note:($('editNote').value||'').trim(),
            texts:{...C.texts},tasks,hidden:[...C.hidden]};
  }
  const exportJSON = () => JSON.stringify(buildExport(),null,2);
  $('exportBtn').addEventListener('click',()=>{
    try{
      const blob=new Blob([exportJSON()],{type:'application/json'}),url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download='content.json';document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),2000);
      notify('content.json を書き出しました');
    }catch{notify('書き出せませんでした。「文字をコピー」をお使いください');}
  });
  $('copyBtn').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(exportJSON());notify('content.json の中身をコピーしました');}
    catch{notify('コピーできませんでした');}
  });
  $('revertBtn').addEventListener('click',()=>{
    if(!draftCount())return notify('取り消す編集はありません');
    if(!confirm('この端末でした編集をすべて取り消しますか？'))return;
    DRAFT=emptyC();try{localStorage.removeItem(CONTENT_KEY);}catch{}
    mergeContent();rebuildTasks();renderAll();refreshEditBar();notify('編集を取り消しました');
  });
  $('howtoBtn').addEventListener('click',()=>$('howtoDialog').showModal());
  $('howtoClose').addEventListener('click',()=>$('howtoDialog').close());
  $('editToggle').addEventListener('click',()=>setEditMode(!state.edit));
  $('editDone').addEventListener('click',()=>setEditMode(false));
  document.addEventListener('click',e=>{if(e.target.closest('#addTaskBtn'))addTask();});
  window.addEventListener('beforeunload',e=>{if(state.edit&&draftCount()){e.preventDefault();e.returnValue='';}});
  $('todayLabel').textContent=TODAY.toLocaleDateString('ja-JP',{year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'});
  captureDefaults();renderAll();route();refreshEditBar();
  const grab=u=>fetch(u+'?ts='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
  Promise.all([grab('board.json'),grab('content.json')]).then(([b,c])=>{
    if(b&&Array.isArray(b.tasks))BOARD=b;
    if(c&&typeof c==='object')SHARED={texts:c.texts||{},tasks:c.tasks||{},hidden:Array.isArray(c.hidden)?c.hidden:[],updatedAt:c.updatedAt||null,updatedBy:c.updatedBy||'',note:c.note||''};
    if(!b&&!c)return;
    mergeContent();buildNodes();Object.assign(state,loadState());
    if(SHARED.updatedBy&&$('editBy'))$('editBy').value=SHARED.updatedBy;
    renderAll();if($('detailDialog').open)renderDetail();refreshEditBar();
  });
  if(state.storageWarning)notify('保存データを読み込めなかったため、初期状態を表示しています');
})();
