import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, Bell, BookOpen, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Download, FileText, FolderOpen, Gauge, Image as ImageIcon, Layers3, LayoutGrid,
  Menu, MoreHorizontal, Package, Palette, PanelLeftClose, PanelLeftOpen, Pause,
  Play, Plus, RotateCcw, Search, Settings2, Sparkles, Upload, WandSparkles, X,
  Check, Clock3, CreditCard, SlidersHorizontal, Target, Video, Zap,
} from 'lucide-react';

type View = 'overview' | 'insights' | 'design' | 'preview' | 'pattern' | 'marketing' | 'strategy' | 'archive' | 'sales' | 'billing';
type Toast = { message: string; tone?: 'success' | 'info' };

const API = '/api';
async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) }, ...options });
  if (!response.ok) throw new Error(await response.text() || `请求失败 ${response.status}`);
  return response.json() as Promise<T>;
}
function download(path: string) { const a = document.createElement('a'); a.href = path.startsWith('http') ? path : `${API}${path}`; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); }
function openExternal(url: string) { window.open(url, '_blank', 'noopener,noreferrer'); }

const designImages = [
  { src: 'assets/editorial-01.jpg', title: '探险能量 · 01', tag: '高饱和拼接 / 穿着效果' },
  { src: 'assets/editorial-02.jpg', title: '探险能量 · 02', tag: '学院针织 / 人像效果' },
  { src: 'assets/kids-fashion.jpg', title: '探险能量 · 03', tag: '产品陈列 / 平铺构图' },
  { src: 'assets/fabric.jpg', title: '探险能量 · 04', tag: '面料纹理 / 细节特写' },
];

const navItems: { id: View; label: string; icon: typeof LayoutGrid; meta?: string }[] = [
  { id: 'overview', label: '总览', icon: LayoutGrid },
  { id: 'insights', label: '市场洞察', icon: Gauge, meta: 'Agent 01' },
  { id: 'design', label: 'AI 设计', icon: WandSparkles, meta: 'Agent 02' },
  { id: 'preview', label: '数字样衣评审', icon: Layers3, meta: 'Agent 03–04' },
  { id: 'marketing', label: '营销内容', icon: Sparkles, meta: 'Agent 05' },
  { id: 'strategy', label: '营销策略', icon: Target, meta: 'Agent 06' },
  { id: 'archive', label: '企业资料库', icon: FolderOpen, meta: 'Agent 07' },
  { id: 'sales', label: '销售分析', icon: Gauge, meta: 'Agent 08' },
];

function App() {
  const [active, setActive] = useState<View>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedDesign, setSelectedDesign] = useState(0);
  const [prompt, setPrompt] = useState('保留柔软亲肤的触感，加入一点轻盈的复古运动感。');
  const [toast, setToast] = useState<Toast | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showCommand, setShowCommand] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    fetch('/api/health').then((response) => response.ok && setBackendConnected(true)).catch(() => setBackendConnected(false));
  }, []);

  const notify = (message: string, tone: Toast['tone'] = 'success') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2800);
  };

  const pageTitle = useMemo(() => ({
    overview: '款式总览', insights: '市场洞察', design: 'AI 设计工作台', preview: '数字样衣评审',
    pattern: '纸板版型', marketing: '营销内容', strategy: '营销策略', archive: '企业资料库', sales: '销售分析', billing: '账单与会员',
  } as Record<View, string>)[active], [active]);

  const runGeneration = async () => {
    setIsRunning(true);
    notify('AI 正在生成 4 个设计方向…', 'info');
    try {
      const response = await fetch('/api/products/product_demo/demo-run', { method: 'POST' });
      if (response.ok) {
        setBackendConnected(true);
        setActive('preview');
        notify('全流程已完成，当前停在人工打样断点');
      } else {
        setActive('design');
        notify('已生成 4 个设计方向');
      }
    } catch {
      setActive('design');
      notify('已生成 4 个设计方向');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <div className="sidebar-top">
          <button className="brand" onClick={() => setActive('overview')} aria-label="回到总览">
            <span className="brand-mark">云</span>
            {sidebarOpen && <span className="brand-word">云麓 <em>STUDIO</em></span>}
          </button>
          <button className="icon-button sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? '收起侧边栏' : '展开侧边栏'}>
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>
        {sidebarOpen && <div className="workspace-switcher" onClick={() => notify('工作空间切换暂未连接后端', 'info')}>
          <span className="workspace-dot">云</span><span><b>云麓童装</b><small>品牌工作空间</small></span><ChevronDown size={15} />
        </div>}
        <nav className="main-nav" aria-label="主导航">
          {navItems.map((item) => { const Icon = item.icon; return (
            <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => setActive(item.id)} title={!sidebarOpen ? item.label : undefined}>
              <Icon size={18} strokeWidth={active === item.id ? 2.4 : 1.8} /><span className="nav-label">{item.label}</span>{sidebarOpen && item.meta && <small>{item.meta}</small>}
            </button>
          ); })}
          <div className="nav-separator" />
          <button className={`nav-item ${active === 'billing' ? 'active' : ''}`} onClick={() => setActive('billing')} title={!sidebarOpen ? '账单与会员' : undefined}><CreditCard size={18} /><span className="nav-label">账单与会员</span></button>
        </nav>
        {sidebarOpen && <div className="sidebar-bottom">
          <div className="usage-card"><div className="usage-head"><span>本月创作额度</span><b>68%</b></div><div className="usage-bar"><i /></div><small>已使用 34 / 50 款</small><button onClick={() => setActive('billing')}>升级会员 <ArrowUpRight size={13} /></button></div>
          <button className="nav-item" onClick={() => notify('设置页即将上线', 'info')}><Settings2 size={18} /><span className="nav-label">设置</span></button>
          <div className="user-chip" onClick={() => setProfileOpen(!profileOpen)}><span className="avatar">林</span><span><b>林小满</b><small>主理人</small></span><MoreHorizontal size={16} /></div>
        </div>}
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><button className="icon-button" onClick={() => setSidebarOpen(!sidebarOpen)}><Menu size={19} /></button><span className="brand-mark small">云</span><b>云麓</b></div>
          <div className="breadcrumbs"><span>云麓童装</span><ChevronRight size={14} /><b>{pageTitle}</b></div>
          <div className="top-actions"><span className={`backend-chip ${backendConnected ? 'connected' : ''}`}><i />{backendConnected ? '演示后端已连接' : '前端演示模式'}</span><button className="search-button" onClick={() => setShowCommand(true)}><Search size={16} /><span>搜索</span><kbd>⌘ K</kbd></button><button className="icon-button notification" onClick={() => notify('目前没有新的通知', 'info')} aria-label="通知"><Bell size={18} /><i /></button><button className="top-avatar" onClick={() => setProfileOpen(!profileOpen)}>林</button></div>
          {profileOpen && <div className="profile-popover"><b>林小满</b><span>云麓童装 · 主理人</span><button onClick={() => notify('账号设置暂未连接后端', 'info')}>账号设置</button><button onClick={() => notify('演示模式已保持登录', 'info')}>退出登录</button></div>}
        </header>

        <div className="page-content">
          <AgentChat agent={pageTitle} placeholder={`告诉 AI 你想如何微调${pageTitle}`} notify={notify} />
          {active === 'overview' && <Overview onNavigate={setActive} onNew={() => setShowNew(true)} onRun={runGeneration} />}
          {active === 'insights' && <Insights notify={notify} onDesign={() => setActive('design')} />}
          {active === 'design' && <DesignStudio selected={selectedDesign} setSelected={setSelectedDesign} prompt={prompt} setPrompt={setPrompt} notify={notify} isRunning={isRunning} />}
          {active === 'preview' && <Preview notify={notify} />}
          {active === 'pattern' && <Pattern notify={notify} />}
          {active === 'marketing' && <Marketing notify={notify} />}
          {active === 'strategy' && <Strategy notify={notify} />}
          {active === 'archive' && <Archive notify={notify} />}
          {active === 'sales' && <Sales notify={notify} />}
          {active === 'billing' && <Billing notify={notify} />}
        </div>
      </main>
      {toast && <div className={`toast ${toast.tone}`}><span className="toast-icon">{toast.tone === 'info' ? <Clock3 size={15} /> : <Check size={15} />}</span>{toast.message}<button onClick={() => setToast(null)}><X size={14} /></button></div>}
      {showCommand && <CommandPalette close={() => setShowCommand(false)} navigate={(view) => { setActive(view); setShowCommand(false); }} />}
      {showNew && <NewProduct close={() => setShowNew(false)} create={() => { setShowNew(false); notify('已创建「春日轻户外」新款草稿'); }} />}
    </div>
  );
}

function PageHeader({ eyebrow, title, copy, action, children }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode; children?: React.ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div><div className="header-actions">{children}{action}</div></div>;
}

function AgentChat({ agent, placeholder, notify, onApplied }: { agent: string; placeholder: string; notify: (m: string, t?: Toast['tone']) => void; onApplied?: (text: string) => void }) {
  const [message, setMessage] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const send = async (preset?: string) => {
    const text = (preset || message).trim(); if (!text || busy) return;
    setMessage(text); setBusy(true); setExpanded(true); setAnswer('');
    try { const data = await api<any>('/products/product_demo/chat', { method: 'POST', body: JSON.stringify({ message: text, context: agent }) }); setAnswer(data.answer); notify(`${agent} 已完成一轮微调`); }
    catch { setAnswer('建议已记录。你可以继续补充颜色、面料、尺寸或渠道目标，我会把它整理成下一轮执行参数。'); notify('AI 暂时离线，已保留本地演示回复', 'info'); }
    finally { setBusy(false); }
  };
  return <section className={`agent-chat ${expanded ? 'is-expanded' : ''}`} aria-label={`${agent} AI 微调`}>
    <div className="agent-chat-glow" />
    <div className="agent-chat-head"><span className="ai-spark"><Sparkles size={14} /></span><div><b>{agent} · AI 微调</b><small>告诉我你想调整的方向</small></div><span className="ai-live"><i />在线</span><button className="icon-button" onClick={() => setExpanded(!expanded)} aria-label={expanded ? '收起 AI 微调' : '展开 AI 微调'}>{expanded ? <ChevronDown size={15}/> : <ArrowUpRight size={15}/>}</button></div>
    <div className="agent-chat-body"><div className="agent-chat-input"><textarea value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(); }} placeholder={placeholder} rows={1}/><button className={`chat-send ${busy ? 'is-busy' : ''}`} onClick={() => send()} disabled={busy} aria-label="发送给 AI"><WandSparkles size={15}/>{busy ? <span className="chat-loader"><i/><i/><i/></span> : <span>发送</span>}</button></div><div className="chat-suggestions"><button onClick={() => send('把当前方案做得更轻、更易生产')}>更轻、更易生产</button><button onClick={() => send('增加一个更大胆的功能细节')}>强化功能</button><button onClick={() => send('给我一版更适合客户沟通的解释')}>客户沟通版</button></div>{busy && <div className="ai-progress"><span className="progress-orb"/><div><b>AI 正在分析上下文</b><small>读取当前 Agent 参数 · 生成可执行建议</small></div><span className="progress-line"><i/></span></div>}{answer && !busy && <div className="agent-answer"><span className="answer-icon"><Check size={13}/></span><p>{answer}</p><button onClick={() => { onApplied?.(answer); notify('已应用 AI 微调建议'); }}>应用建议</button></div>}</div>
  </section>;
}

function Overview({ onNavigate, onNew, onRun }: { onNavigate: (view: View) => void; onNew: () => void; onRun: () => void }) {
  return <>
    <PageHeader eyebrow="WORKSPACE / 2024 秋冬" title="把灵感，变成下一款好衣服。" copy="从市场趋势到纸板打样，云麓把每一个决定都变得更清晰。" action={<button className="button primary" onClick={onNew}><Plus size={17} />新建款式</button>} />
    <div className="hero-workflow">
      <div className="workflow-copy"><div className="live-chip"><span />正在进行</div><h2>奶油云朵<br /><i>轻户外卫衣</i></h2><p>从一块柔软面料开始，探索适合 3–6 岁儿童的轻户外系列。</p><div className="workflow-meta"><span><Clock3 size={14} />最后编辑 · 12 分钟前</span><span><Sparkles size={14} />AI 协作 68%</span></div><div className="workflow-capabilities"><span><Check size={12} />趋势已带入</span><span><Check size={12} />面料已识别</span><span><Clock3 size={12} />等你确认</span></div><button className="text-button" onClick={() => onNavigate('design')}>继续创作 <ArrowUpRight size={16} /></button></div>
      <div className="hero-image"><img src={designImages[0].src} alt="奶油云朵款式参考图" /><div className="image-overlay"><span>当前精选</span><b>01 / 04</b></div></div>
    </div>
    <div className="section-heading"><div><span className="eyebrow">PROJECT PULSE</span><h3>创作进度</h3></div><button className="quiet-button" onClick={onRun}><Play size={15} />一键推进流程</button></div>
    <div className="progress-strip">{[['01','市场洞察','已完成','done'],['02','AI 设计','进行中','current'],['03','数字样衣评审','待确认',''],['04','人工打样','待开始',''],['05','营销内容','待开始','']].map(([num,label,status,kind], i) => <button key={label} className={`progress-step ${kind}`} onClick={() => onNavigate((['insights','design','preview','preview','marketing'] as View[])[i])}><span>{kind === 'done' ? <Check size={14} /> : num}</span><div><b>{label}</b><small>{status}</small></div>{i < 4 && <i />}</button>)}</div>
    <div className="overview-grid"><div className="panel trend-panel"><div className="panel-heading"><div><span className="eyebrow">AGENT 01 / MARKET</span><h3>本周市场信号</h3></div><button className="icon-button" onClick={() => onNavigate('insights')} aria-label="查看市场洞察"><ArrowUpRight size={17} /></button></div><div className="trend-row"><div className="trend-number">+28<small>%</small></div><div><b>轻户外童装</b><p>近 30 天搜索热度增长</p></div><span className="trend-up">↑ 12.4%</span></div><div className="sparkline"><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span /></div><div className="tag-row"><span>防泼水面料</span><span>奶油色系</span><span>轻机能</span></div></div><div className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">RECENT PROJECTS</span><h3>最近的款式</h3></div><button className="quiet-button" onClick={onNew}>查看全部 <ArrowUpRight size={14} /></button></div><div className="project-list">{[['奶油云朵 · 轻户外卫衣','设计中','assets/kids-fashion.jpg','今天'],['城市漫游 · 防风马甲','已完成','assets/fabric.jpg','昨天'],['小小探险家 · 工装裤','打样中','assets/sample.jpg','7 月 28 日']].map(([name,status,img,date]) => <button className="project-row" key={name} onClick={() => onNavigate('design')}><img src={img} alt="" /><span><b>{name}</b><small>{status}</small></span><time>{date}</time><ChevronRight size={15} /></button>)}</div></div></div>
  </>;
}

function Insights({ notify, onDesign }: { notify: (m: string, t?: Toast['tone']) => void; onDesign: () => void }) {
  const [keyword, setKeyword] = useState('轻户外童装 / 3-6岁 / 秋冬');
  const [report, setReport] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const generate = async () => {
    setBusy(true); notify('正在整理趋势并生成报告…', 'info');
    try { const data = await api<any>('/products/product_demo/market-report', { method: 'POST', body: JSON.stringify({ keyword }) }); setReport(data.report); notify('市场报告已生成，可导出 PDF / Markdown / CSV'); }
    catch { notify('报告生成失败，请确认演示后端已启动', 'info'); } finally { setBusy(false); }
  };
  const summary = report?.executive_summary || '“轻”正在成为新的户外关键词。家长更在意孩子穿着的自由感，以及一件衣服从公园到日常的自然切换。';
  const competitors = report?.competitors || [{brand:'Mini Rodini',focus:'轻户外胶囊系列',growth:'+22%'},{brand:'Bobo Choses',focus:'自然色套装',growth:'+18%'},{brand:'Konges Sløjd',focus:'防风软壳外套',growth:'+15%'}];
  return <><PageHeader eyebrow="AGENT 01 / MARKET INTELLIGENCE" title="市场洞察" copy="让趋势成为可被验证、可导出的设计依据。" action={<button className="button primary" onClick={generate} disabled={busy}><Sparkles size={17} />{busy ? '生成中…' : '生成新报告'}</button>}><div className="export-menu"><button className="quiet-button" onClick={() => download('/products/product_demo/market-report/export?format=pdf')}><Download size={15} />导出 PDF</button><button className="icon-button" title="导出 Markdown" onClick={() => download('/products/product_demo/market-report/export?format=md')}><FileText size={15}/></button><button className="icon-button" title="导出 CSV" onClick={() => download('/products/product_demo/market-report/export?format=csv')}><LayoutGrid size={15}/></button></div></PageHeader><div className="insights-toolbar"><div className="input-search"><Search size={16} /><input value={keyword} onChange={e => setKeyword(e.target.value)} /><button onClick={generate}><ArrowUpRight size={14} /></button></div><span className="last-update"><span />{report ? `${report.source} · 刚刚生成` : '完整演示案例已加载'}</span></div><div className="insight-grid"><div className="panel insight-main"><div className="panel-heading"><div><span className="eyebrow">TREND SIGNALS</span><h3>{report?.title || '这个秋冬，家长在寻找什么？'}</h3></div><span className="confidence">置信度 {Math.round((report?.confidence || .86)*100)}%</span></div><p className="insight-lead">{summary}</p><div className="signal-cards"><div><span className="signal-icon peach"><Palette size={18} /></span><b>{report?.color_trends?.[0] || '奶油自然色'}</b><small>色彩热度 · +31%</small><div className="mini-bars"><i/><i/><i/><i/><i/></div></div><div><span className="signal-icon mint"><Target size={18}/></span><b>{report?.silhouette_trends?.[0] || '轻机能廓形'}</b><small>版型热度 · +24%</small><div className="mini-bars blue"><i/><i/><i/><i/><i/></div></div><div><span className="signal-icon lilac"><Package size={18}/></span><b>{report?.material_trends?.[0] || '防泼水棉感'}</b><small>面料热度 · +18%</small><div className="mini-bars purple"><i/><i/><i/><i/><i/></div></div></div></div><div className="panel market-list"><div className="panel-heading"><h3>竞品动向</h3><button className="icon-button" onClick={() => download('/products/product_demo/market-report/export?format=pdf')}><MoreHorizontal size={17}/></button></div>{competitors.map((x:any) => <div className="market-item" key={x.brand}><div className="brand-circle">{x.brand[0]}</div><span><b>{x.brand}</b><small>{x.focus}</small></span><strong>↑ {x.growth.replace('+','')}</strong></div>)}<button className="full-link" onClick={() => download('/products/product_demo/market-report/export?format=pdf')}>打开完整竞品报告 <ArrowUpRight size={14}/></button></div></div><div className="panel recommendation"><div className="rec-mark"><WandSparkles size={17}/></div><div><span className="eyebrow">给设计的建议</span><h3>把“轻”做成触感，也做成可见功能。</h3><p>{report?.design_recommendation || '建议在袖口与侧袋加入柔软弹力收口，主面料选用 40D 防泼水棉感布，内里保持亲肤。'}</p></div><button className="button dark" onClick={onDesign}>带入 AI 设计 <ArrowUpRight size={16}/></button></div></>;
}

function DesignStudio({ selected, setSelected, prompt, setPrompt, notify, isRunning }: { selected: number; setSelected: (v: number) => void; prompt: string; setPrompt: (v: string) => void; notify: (m: string, t?: Toast['tone']) => void; isRunning: boolean }) {
  const [filter, setFilter] = useState('全部');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [materialName, setMaterialName] = useState('奶油棉感 · 40D');
  const modes = ['穿着','穿着','平铺','细节'];
  const visible = designImages.map((x,i) => ({...x,i})).filter(x => filter === '全部' || modes[x.i] === filter);
  const generate = async () => { setBusy(true); notify('AI 正在创建新一轮设计…','info'); try { const data = await api<any>('/products/product_demo/design-generate',{method:'POST',body:JSON.stringify({prompt,category:'卫衣'})}); setResult(data.design); notify(`已生成 ${data.design.designs.length} 个方向并保存运行记录`); } catch { notify('生成失败，请确认演示后端已启动','info'); } finally { setBusy(false); } };
  const uploadMaterial = async (file?: File) => { if(!file) return; const form = new FormData(); form.append('file',file); try { const response = await fetch(`${API}/products/product_demo/sample-upload`,{method:'POST',body:form}); if(!response.ok) throw new Error(); setMaterialName(file.name); notify('面料参考已上传并完成识别'); } catch { notify('上传失败，请确认演示后端已启动','info'); } };
  return <><PageHeader eyebrow="AGENT 02 / GENERATIVE DESIGN" title="AI 设计工作台" copy="从平铺、穿着到细节和数字样衣，完整保留每一轮产出。" action={<button className="button primary" onClick={() => notify(`方向 ${selected+1} 已保存为版本 05`)}><Check size={17}/>保存为版本</button>}><button className="quiet-button" onClick={() => download('/products/product_demo/design-export')}><Download size={15}/>下载设计包</button></PageHeader><div className="design-layout"><div className="design-canvas"><div className="canvas-toolbar"><div className="segmented">{['全部','平铺','穿着','细节'].map(x=><button key={x} className={filter===x?'selected':''} onClick={()=>setFilter(x)}>{x}</button>)}</div><span>{visible.length} 个结果 · 平铺 / 穿着 / 细节</span><button className="icon-button" onClick={()=>setFilter('全部')}><SlidersHorizontal size={16}/></button></div><div className="design-grid">{visible.map(item=><button key={item.title} className={`design-card ${selected===item.i?'selected':''}`} onClick={()=>setSelected(item.i)}><div className="design-visual"><img src={item.src} alt={item.title}/><div className="visual-shade"/><div className="render-badge"><Sparkles size={11}/>{modes[item.i]} · AI 方案 0{item.i+1}</div><div className="render-specs"><span>可生产性 {result?.feasibility?.[item.i] || 88-item.i*3}%</span><span>预计成本 ¥{result?.estimated_cost?.[item.i] || 86+item.i*9}</span></div><div className={`render-color color-${item.i+1}`}><i/><i/><i/></div></div><div className="design-card-meta"><span>0{item.i+1}</span><b>{result?.designs?.[item.i]?.title || item.title}</b><small>{result?.designs?.[item.i]?.detail || item.tag}</small>{selected===item.i&&<span className="selected-mark"><Check size={13}/></span>}</div></button>)}</div><div className="canvas-footer"><span><span className="status-dot"/>方向 0{selected+1} · {result ? `${result.source} 已完成` : '完整案例已加载'}</span><button className="quiet-button" onClick={()=>download('/products/product_demo/design-export')}><Download size={15}/>导出本轮</button></div>{result&&<div className="generation-result"><Sparkles size={16}/><div><b>AI 设计说明</b><p>{result.ai_explanation}</p></div></div>}</div><aside className="design-inspector"><div className="inspector-tabs"><button className="active">创作</button><button onClick={()=>notify('参数面板：尺码 90-120、缝份 1cm、目标成本 ¥99','info')}>参数</button></div><label className="material-upload upload-label"><div className="material-preview"><img src="assets/fabric.jpg" alt="上传的面料参考"/></div><div><span className="eyebrow">参考面料 · 点击替换</span><b>{materialName}</b><small>已识别 · 亲肤 / 防泼水</small></div><Upload size={16}/><input type="file" accept="image/*" onChange={e=>uploadMaterial(e.target.files?.[0])}/></label><div className="function-status"><span className="eyebrow">本轮 AI 正在使用</span><div><span><Gauge size={13}/>市场趋势约束<Check size={12}/></span><span><Package size={13}/>面料属性识别<Check size={12}/></span><span><FileText size={13}/>基础版型约束<Check size={12}/></span><span><CreditCard size={13}/>单款成本预估<Check size={12}/></span></div></div><label className="field-label">告诉 AI 你想怎么改</label><div className="prompt-box"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)}/><div className="prompt-tools"><button onClick={()=>setPrompt(prompt+' 领口更利落一些。')}><Sparkles size={14}/>智能建议</button><span>{prompt.length}/240</span></div></div><div className="quick-prompts"><span>试试这些</span><button onClick={()=>setPrompt('把整体色彩改为高饱和电光蓝，加入撞色结构线。')}>夸张配色</button><button onClick={()=>setPrompt('增加可拆卸风帽、立体口袋和反光织带。')}>强化功能</button></div><button className={`generate-button ${busy||isRunning?'running':''}`} disabled={busy} onClick={generate}><WandSparkles size={17}/>{busy?'生成中…':'生成新一轮'}</button><div className="inspector-note"><Zap size={14}/><span>每轮结果、参数、成本和模型来源都会保存。</span></div></aside></div></>;
}

function Preview({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  const [view, setView] = useState('联合视图');
  const [scale, setScale] = useState(92);
  return <><PageHeader eyebrow="AGENT 03–04 / DIGITAL SAMPLE REVIEW" title="数字样衣评审" copy="把真人试穿、3D 数字样衣、纸样和尺寸放在同一个决策界面里。" action={<button className="button primary" onClick={() => notify('版本 V04 已确认，纸样已锁定并进入人工打样')}><Check size={17} />确认并送样</button>}><button className="quiet-button" onClick={() => download('/assets/pattern-preview.pdf')}><Download size={15} />导出纸样</button></PageHeader><div className="review-toolbar"><div className="segmented">{['联合视图','3D 样衣','试穿样本','2D 纸样'].map((x) => <button key={x} className={view === x ? 'selected' : ''} onClick={() => { setView(x); notify(`已切换至${x}`, 'info'); }}>{x}</button>)}</div><div className="review-sync"><span><span className="status-dot" />三个视图实时联动</span><button className="quiet-button" onClick={() => notify('批注模式已开启', 'info')}><SlidersHorizontal size={15} />添加批注</button><button className="icon-button" onClick={() => notify('评审记录已打开', 'info')}><MoreHorizontal size={17} /></button></div></div><div className="unified-review"><div className="review-board"><img src="assets/digital-sample-review.png" alt="真人试穿、3D 数字样衣与 2D 纸样联合评审图" style={{ transform: `scale(${scale / 100})` }} /><div className="board-zoom"><button className="icon-button" onClick={() => setScale(Math.max(76, scale - 4))}>−</button><span>{scale}%</span><button className="icon-button" onClick={() => setScale(Math.min(108, scale + 4))}>+</button></div></div><aside className="review-inspector"><div className="panel review-summary"><div className="panel-heading"><div><span className="eyebrow">REVIEW SUMMARY</span><h3>本轮评审结论</h3></div><span className="confidence">完成度 92%</span></div><div className="review-score"><div><strong>3</strong><span>处尺寸修改</span></div><div><strong>1</strong><span>项待版师确认</span></div><div><strong>0</strong><span>项生产风险</span></div></div><div className="review-findings"><button onClick={() => notify('已定位到袖长批注', 'info')}><span className="finding-dot warn" /><span><b>袖长建议缩短 1.5 cm</b><small>来自真人试穿样本 · 高置信</small></span><ChevronRight size={15} /></button><button onClick={() => notify('已定位到胸围批注', 'info')}><span className="finding-dot info" /><span><b>胸围活动量增加 2.4 cm</b><small>3D 动作模拟 · 中高置信</small></span><ChevronRight size={15} /></button><button onClick={() => notify('已定位到罗纹批注', 'info')}><span className="finding-dot good" /><span><b>下摆罗纹弹性通过</b><small>纸样参数与面料属性匹配</small></span><ChevronRight size={15} /></button></div></div><div className="panel review-actions"><div className="panel-heading"><div><span className="eyebrow">VERSION V04</span><h3>下一步</h3></div><Clock3 size={17} color="#8c83cf" /></div><p>确认后将锁定当前 3D 参数与纸样尺寸，并创建人工打样断点。</p><button className="button dark" onClick={() => notify('已创建人工打样任务，等待样衣上传', 'info')}>创建打样任务 <ArrowUpRight size={15} /></button><button className="full-link" onClick={() => notify('已回退到版本 V03', 'info')}><RotateCcw size={14} />回退到上一版本</button></div></aside></div></>;
}

function Pattern({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  return <><PageHeader eyebrow="AGENT 04 / PATTERN OUTPUT" title="纸板版型" copy="让确认过的设计，拥有一份可以交给工厂的语言。" action={<button className="button primary" onClick={async () => { await api('/products/product_demo/agents/agent4',{method:'POST',body:'{}'}); download('/assets/pattern-preview.pdf'); notify('纸板 PDF 已生成并下载'); }}><FileText size={17} />生成纸板 PDF</button>}><button className="quiet-button" onClick={() => notify('版型模板已打开', 'info')}><FolderOpen size={15} />模板库</button></PageHeader><div className="pattern-layout"><div className="pattern-preview"><div className="paper-toolbar"><span>奶油云朵_轻户外卫衣_v03.pdf</span><span><button className="icon-button"><Download size={15} /></button><button className="icon-button"><MoreHorizontal size={15} /></button></span></div><div className="paper"><div className="paper-title">云麓童装 · 试制纸样 <small>YUNLU STUDIO</small></div><div className="pattern-shape left"><span>前片<br /><small>FRONT</small></span></div><div className="pattern-shape right"><span>后片<br /><small>BACK</small></span></div><div className="paper-line" /><div className="paper-scale">100 mm 校准线</div><div className="paper-footer">款号 YL-24AW-021 · 尺码 110 · 缝份 1 cm · Grainline ↑</div></div><div className="paper-pages"><span className="active">1 / 4</span><button className="icon-button"><ChevronLeft size={15} /></button><button className="icon-button"><ChevronRight size={15} /></button></div></div><aside className="pattern-side"><div className="panel spec-panel"><div className="panel-heading"><div><span className="eyebrow">PATTERN SPECS</span><h3>版型参数</h3></div><button className="quiet-button">编辑</button></div>{[['版型','轻户外卫衣'],['尺码','90 · 100 · 110 · 120'],['面料幅宽','150 cm'],['缝份','1 cm']].map(([a,b]) => <div className="spec-row" key={a}><span>{a}</span><b>{b}</b></div>)}<div className="review-note"><Check size={15} /><span>模板已通过版师初审<br /><small>建议完成实体试制后再投入生产</small></span></div></div><div className="checkpoint"><div className="checkpoint-icon"><Pause size={17} /></div><div><span className="eyebrow">NEXT CHECKPOINT</span><h3>等待人工打样</h3><p>下载纸板，交给工厂完成第一件样衣。回来后上传平拍图，继续生成营销内容。</p><button className="button dark" onClick={() => notify('已进入人工打样断点', 'info')}>标记为已送样 <ArrowUpRight size={15} /></button></div></div></aside></div></>;
}

function Marketing({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  const [tab, setTab] = useState('文案'); const [content, setContent] = useState<any>(null); const [platform, setPlatform] = useState<'xiaohongshu'|'douyin'|'detail_page'>('xiaohongshu');
  const generate = async () => { try { const data = await api<any>('/products/product_demo/content-generate',{method:'POST'}); setContent(data.content); notify('营销内容、海报清单和视频分镜已生成'); } catch { notify('生成失败，请确认演示后端已启动','info'); } };
  const copy = async () => { const text = content?.copy?.[platform] || '孩子的秋天，应该轻一点。'; await navigator.clipboard?.writeText(text); notify('内容已复制到剪贴板'); };
  return <><PageHeader eyebrow="AGENT 05 / MARKETING CONTENT" title="营销内容" copy="样衣回来以后，让每一处细节都值得被看见。" action={<button className="button primary" onClick={generate}><Sparkles size={17}/>生成营销素材</button>}><button className="quiet-button" onClick={()=>download('/products/product_demo/marketing-export')}><Download size={15}/>下载素材包</button></PageHeader><div className="marketing-tabs">{['文案','海报','短视频'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{x}{x==='短视频'&&<span className="beta">BETA</span>}</button>)}</div><div className="marketing-layout"><div className="sample-upload"><div className="sample-image"><img src="assets/sample.jpg" alt="已上传的样衣平拍图"/><div className="sample-overlay"><span><Check size={13}/>已上传样衣图</span><label><Upload size={14}/>替换<input type="file" accept="image/*" onChange={async e=>{const file=e.target.files?.[0]; if(file){const form=new FormData();form.append('file',file);await fetch(`${API}/products/product_demo/sample-upload`,{method:'POST',body:form});notify('样衣图已上传');}}}/></label></div></div><div className="upload-meta"><span><ImageIcon size={15}/>样衣平拍图 · 3.2 MB</span><span>上传于今天 09:42</span></div></div><div className="copy-panel panel"><div className="panel-heading"><div><span className="eyebrow">CONTENT PREVIEW</span><h3>{tab}草稿</h3></div><button className="icon-button" onClick={copy}><CopyIcon/></button></div>{tab==='文案' ? <><div className="copy-platform"><button className={platform==='xiaohongshu'?'active':''} onClick={()=>setPlatform('xiaohongshu')}>小红书</button><button className={platform==='douyin'?'active':''} onClick={()=>setPlatform('douyin')}>抖音</button><button className={platform==='detail_page'?'active':''} onClick={()=>setPlatform('detail_page')}>详情页</button></div><div className="copy-content"><h4>{content?.copy?.xiaohongshu?.split('。')[0] || '孩子的秋天，应该轻一点。'}</h4><p>{content?.copy?.[platform] || '点击“生成营销素材”，获得完整平台文案、标签与转化卖点。'}</p></div><div className="copy-actions"><button className="button dark" onClick={copy}>复制文案</button><button className="quiet-button" onClick={()=>openExternal(platform==='xiaohongshu'?'https://www.xiaohongshu.com/':platform==='douyin'?'https://www.douyin.com/':'https://www.taobao.com/')}><ArrowUpRight size={15}/>打开平台</button></div></> : tab==='海报' ? <div className="poster-output">{(content?.posters || ['01-从灵感到成衣.png','02-AI设计工作台.png','03-数字样衣评审.png']).map((p:string)=><a key={p} href={`/assets/${p}`} target="_blank" rel="noreferrer"><img src={`/assets/${p}`} alt={p}/><b>{p}</b></a>)}</div> : <div className="video-output">{(content?.videos || [{duration:'15s',storyboard:['面料特写','穿着跑动','功能细节']},{duration:'30s',storyboard:['趋势开场','真人试穿','购买理由']}]).map((v:any)=><div key={v.duration}><Video size={18}/><b>{v.duration} 分镜</b><span>{v.storyboard.join(' · ')}</span></div>)}</div>}</div></div></>;
}

function CopyIcon() { return <span className="copy-icon">↗</span>; }

function Strategy({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  return <><PageHeader eyebrow="AGENT 06 / GO-TO-MARKET STRATEGY" title="营销策略" copy="把一个好款，变成一场有节奏的新品发布。" action={<button className="button primary" onClick={() => notify('营销策略已生成并保存到企业资料库')}><Sparkles size={17} />生成策略方案</button>}><button className="quiet-button" onClick={() => notify('策略版本已导出', 'info')}><Download size={15} />导出方案</button></PageHeader><div className="agent-grid strategy-grid"><div className="panel strategy-hero"><span className="eyebrow">LAUNCH PLAN / 2024 AW</span><h2>让“轻户外”<br /><i>从一个卖点变成一套节奏。</i></h2><p>为「奶油云朵 · 轻户外卫衣」生成一份适合小微品牌执行的 21 天新品方案。</p><div className="strategy-kpis"><div><strong>21</strong><span>天发布节奏</span></div><div><strong>3</strong><span>个核心渠道</span></div><div><strong>¥169</strong><span>建议起售价</span></div></div></div><div className="panel channel-panel"><div className="panel-heading"><div><span className="eyebrow">CHANNEL MIX</span><h3>渠道策略</h3></div><Target size={17} color="#8174e8" /></div>{[['小红书','种草预热','D-7 至 D-1','内容 6 篇'],['抖音','穿着效果','D0 至 D+7','短视频 3 条'],['电商详情页','转化承接','D0 上线','卖点 5 个']].map(([channel,goal,timing,metric], i) => <div className="channel-row" key={channel}><span className={`channel-index c${i+1}`}>{i+1}</span><span><b>{channel}</b><small>{goal} · {timing}</small></span><strong>{metric}</strong></div>)}<button className="full-link" onClick={() => notify('已复制渠道执行清单', 'info')}>复制执行清单 <ArrowUpRight size={14} /></button></div><div className="panel cadence-panel"><div className="panel-heading"><div><span className="eyebrow">LAUNCH CADENCE</span><h3>三段式发布节奏</h3></div><Clock3 size={17} color="#9c9da5" /></div><div className="cadence"><div className="cadence-step done"><span>D-7</span><b>预热</b><small>面料故事与趋势内容</small></div><div className="cadence-step current"><span>D0</span><b>首发</b><small>穿着视频 + 限量首发</small></div><div className="cadence-step"><span>D+14</span><b>复购</b><small>用户反馈与颜色扩展</small></div></div></div></div></>;
}

function Archive({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  const folders = [['设计版本','4 个版本','/assets/editorial-01.jpg'],['纸样与规格','3 个文件','/assets/digital-sample-review.png'],['营销素材','8 个素材','/assets/sample.jpg'],['市场报告','2 份报告','/assets/fabric.jpg']];
  return <><PageHeader eyebrow="AGENT 07 / ENTERPRISE DATA HUB" title="企业资料库" copy="每一张图、每一个版本和每一次决策，都有自己的位置。" action={<button className="button primary" onClick={() => notify('资料库已完成自动归档')}><FolderOpen size={17} />自动归档</button>}><button className="quiet-button" onClick={() => notify('标签管理已打开', 'info')}><SlidersHorizontal size={15} />管理标签</button></PageHeader><div className="archive-toolbar"><div className="input-search"><Search size={16} /><input placeholder="搜索款号、面料、版本或标签" /><button><Search size={14} /></button></div><div className="tag-row"><span>2024 AW</span><span>轻户外</span><span>3-6岁</span></div></div><div className="archive-grid">{folders.map(([title,count,img]) => <button className="archive-folder panel" key={title} onClick={() => notify(`已打开${title}资料`, 'info')}><img src={img} alt="" /><div className="folder-tint" /><div className="folder-copy"><span className="eyebrow">YUNLU ARCHIVE</span><h3>{title}</h3><small>{count} · 最近更新 12 分钟前</small></div><ArrowUpRight size={18} /></button>)}</div><div className="panel archive-table"><div className="panel-heading"><div><span className="eyebrow">RECENT ASSETS</span><h3>最近归档</h3></div><button className="quiet-button" onClick={() => notify('已导出资料清单', 'info')}><Download size={14} />导出</button></div>{[['YL-24AW-021','数字样衣评审图','digital_review','今天 10:24'],['YL-24AW-021','纸样规格 V04','pattern_pdf','今天 10:18'],['YL-24AW-021','市场趋势报告','market_report','昨天 18:42']].map(([code,name,type,date]) => <div className="asset-row" key={name}><span className="asset-type">{type}</span><b>{name}</b><span>{code}</span><time>{date}</time><MoreHorizontal size={15} /></div>)}</div></>;
}

function Sales({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  return <><PageHeader eyebrow="AGENT 08 / SALES INTELLIGENCE" title="销售分析" copy="看清哪一款在成为爆款，再把结果写回下一轮市场判断。" action={<button className="button primary" onClick={() => notify('销售数据已分析，结论已回流市场报告')}><Gauge size={17} />分析并回流 Agent1</button>}><button className="quiet-button" onClick={() => notify('销售 CSV 导入功能暂未连接', 'info')}><Upload size={15} />导入销售数据</button></PageHeader><div className="sales-hero panel"><div><span className="eyebrow">AUGUST / ALL CHANNELS</span><h2>轻户外系列正在被更多家庭选择。</h2><p>系统结合销量、内容互动和款式属性，识别出下一轮值得放大的设计方向。</p></div><div className="sales-total"><strong>¥18.6k</strong><span>销售额</span><b>↑ 28.4%</b></div></div><div className="sales-grid"><div className="panel sales-chart"><div className="panel-heading"><div><span className="eyebrow">WINNER SIGNALS</span><h3>爆款信号</h3></div><span className="confidence">回流已开启</span></div><div className="winner-row"><span className="winner-rank">01</span><span><b>电光蓝配色</b><small>互动率高于平均 42%</small></span><strong>↑ 42%</strong></div><div className="winner-row"><span className="winner-rank">02</span><span><b>轻量针织</b><small>加购率高于平均 31%</small></span><strong>↑ 31%</strong></div><div className="winner-row"><span className="winner-rank">03</span><span><b>可活动袖窿</b><small>退货率低于平均 18%</small></span><strong>↑ 18%</strong></div></div><div className="panel feedback-panel"><div className="panel-heading"><div><span className="eyebrow">FEEDBACK TO AGENT 01</span><h3>下一轮市场建议</h3></div><RotateCcw size={17} color="#8174e8" /></div><div className="feedback-box"><span className="feedback-plus">+</span><div><b>继续放大</b><p>高对比蓝色、轻量保暖、活动结构</p></div></div><div className="feedback-box minus"><span className="feedback-minus">−</span><div><b>减少投入</b><p>厚重填充、复杂装饰、难维护部件</p></div></div><button className="button dark" onClick={() => notify('已将销售反馈写回最新市场报告')}>写回 Agent1 数据源 <ArrowUpRight size={15} /></button></div></div></>;
}

function Billing({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  return <><PageHeader eyebrow="ACCOUNT / SUBSCRIPTION" title="账单与会员" copy="让创作持续发生，也让每一笔成本清晰可见。" action={<button className="button primary" onClick={() => notify('套餐升级流程暂未连接支付', 'info')}><Zap size={17} />升级会员</button>} /><div className="billing-hero"><div><span className="eyebrow">当前会员计划</span><h2>标准版 <i>·</i> Standard</h2><p>有效期至 2024 年 12 月 31 日 · Agent 01–04 无限使用</p></div><div className="billing-price"><strong>¥3,799</strong><span>/ 月</span></div></div><div className="billing-grid"><div className="panel billing-usage"><div className="panel-heading"><div><span className="eyebrow">AUGUST 2024</span><h3>本月用量</h3></div><button className="quiet-button" onClick={() => notify('用量报表已导出', 'info')}><Download size={15} />导出</button></div><div className="usage-metrics"><div><span>完成款式</span><b>12 <small>/ 50</small></b><i className="metric-progress"><em style={{ width: '24%' }} /></i></div><div><span>AI 设计轮次</span><b>38 <small>次</small></b><i className="metric-progress"><em style={{ width: '64%' }} /></i></div><div><span>营销素材</span><b>8 <small>款</small></b><i className="metric-progress"><em style={{ width: '32%' }} /></i></div></div></div><div className="panel invoices"><div className="panel-heading"><h3>最近账单</h3><button className="icon-button"><MoreHorizontal size={17} /></button></div>{[['2024.08.01','标准版会员月费','¥3,799','已支付'],['2024.07.12','营销内容 · 轻户外卫衣','¥20','已支付'],['2024.07.04','营销内容 · 城市漫游','¥20','已支付']].map(([date,name,price,status]) => <div className="invoice-row" key={date + name}><span>{date}</span><b>{name}</b><strong>{price}</strong><small><Check size={12} />{status}</small></div>)}</div></div></>;
}

function CommandPalette({ close, navigate }: { close: () => void; navigate: (view: View) => void }) {
  const options: [View,string,string][] = [['overview','回到款式总览','⌘ 1'],['insights','打开市场洞察','⌘ 2'],['design','打开 AI 设计工作台','⌘ 3'],['preview','打开数字样衣评审','⌘ 4'],['marketing','打开营销内容','⌘ 5'],['strategy','打开营销策略','⌘ 6'],['archive','打开企业资料库','⌘ 7'],['sales','打开销售分析','⌘ 8'],['billing','打开账单与会员','⌘ 9']];
  return <div className="modal-backdrop" onMouseDown={close}><div className="command-palette" onMouseDown={(e) => e.stopPropagation()}><div className="command-search"><Search size={18} /><input autoFocus placeholder="搜索工作台…" /><kbd>ESC</kbd></div>{options.map(([view,label,key]) => <button key={view} onClick={() => navigate(view)}><span className="command-icon"><ArrowUpRight size={15} /></span><span>{label}</span><kbd>{key}</kbd></button>)}<div className="command-footer"><span>快速打开页面</span><span><kbd>↑↓</kbd>选择 <kbd>↵</kbd>确认</span></div></div></div>;
}

function NewProduct({ close, create }: { close: () => void; create: () => void }) {
  const [name, setName] = useState('春日轻户外');
  return <div className="modal-backdrop" onMouseDown={close}><div className="new-modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">NEW PROJECT</span><h2>新建一个款式</h2></div><button className="icon-button" onClick={close}><X size={18} /></button></div><label>款式名称<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>品类<div className="select-like">卫衣 <ChevronDown size={15} /></div></label><label>面向年龄<div className="select-like">3–6 岁 <ChevronDown size={15} /></div></label><div className="modal-foot"><button className="quiet-button" onClick={close}>取消</button><button className="button primary" onClick={create}><Plus size={16} />创建款式</button></div></div></div>;
}

export default App;
