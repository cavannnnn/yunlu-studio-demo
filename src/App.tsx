import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, Bell, BookOpen, ChevronDown, ChevronLeft, ChevronRight, CircleHelp,
  Download, FileText, FolderOpen, Gauge, Image as ImageIcon, Layers3, LayoutGrid,
  Menu, MoreHorizontal, Package, Palette, PanelLeftClose, PanelLeftOpen, Pause,
  Play, Plus, RotateCcw, Search, Settings2, Sparkles, Upload, WandSparkles, X,
  Check, Clock3, CreditCard, SlidersHorizontal, Target, Video, Zap,
} from 'lucide-react';

type View = 'overview' | 'insights' | 'design' | 'preview' | 'pattern' | 'marketing' | 'billing';
type Toast = { message: string; tone?: 'success' | 'info' };

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
    pattern: '纸板版型', marketing: '营销内容', billing: '账单与会员',
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
          {active === 'overview' && <Overview onNavigate={setActive} onNew={() => setShowNew(true)} onRun={runGeneration} />}
          {active === 'insights' && <Insights onRun={runGeneration} />}
          {active === 'design' && <DesignStudio selected={selectedDesign} setSelected={setSelectedDesign} prompt={prompt} setPrompt={setPrompt} notify={notify} isRunning={isRunning} />}
          {active === 'preview' && <Preview notify={notify} />}
          {active === 'marketing' && <Marketing notify={notify} />}
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

function Insights({ onRun }: { onRun: () => void }) {
  return <><PageHeader eyebrow="AGENT 01 / MARKET INTELLIGENCE" title="市场洞察" copy="让趋势成为可被验证的设计依据。" action={<button className="button primary" onClick={onRun}><Sparkles size={17} />生成新报告</button>}><button className="quiet-button"><Download size={15} />导出报告</button></PageHeader><div className="insights-toolbar"><div className="input-search"><Search size={16} /><input defaultValue="轻户外童装 / 3-6岁 / 秋冬" /><button><ArrowUpRight size={14} /></button></div><span className="last-update"><span />数据更新于 2024.08.22 · 10:24</span></div><div className="insight-grid"><div className="panel insight-main"><div className="panel-heading"><div><span className="eyebrow">TREND SIGNALS</span><h3>这个秋冬，家长在寻找什么？</h3></div><span className="confidence">置信度 86%</span></div><p className="insight-lead">“轻”正在成为新的户外关键词。相比复杂的功能堆叠，家长更在意孩子穿着的自由感，以及一件衣服从公园到日常的自然切换。</p><div className="signal-cards"><div><span className="signal-icon peach"><Palette size={18} /></span><b>奶油自然色</b><small>色彩热度 · +31%</small><div className="mini-bars"><i /><i /><i /><i /><i /></div></div><div><span className="signal-icon mint"><Target size={18} /></span><b>轻机能廓形</b><small>版型热度 · +24%</small><div className="mini-bars blue"><i /><i /><i /><i /><i /></div></div><div><span className="signal-icon lilac"><Package size={18} /></span><b>防泼水棉感</b><small>面料热度 · +18%</small><div className="mini-bars purple"><i /><i /><i /><i /><i /></div></div></div></div><div className="panel market-list"><div className="panel-heading"><h3>竞品动向</h3><button className="icon-button"><MoreHorizontal size={17} /></button></div>{[['Mini Rodini','轻户外胶囊系列','↑ 22%'],['Bobo Choses','自然色套装','↑ 18%'],['Konges Sløjd','防风软壳外套','↑ 15%']].map(([brand,focus,growth]) => <div className="market-item" key={brand}><div className="brand-circle">{brand[0]}</div><span><b>{brand}</b><small>{focus}</small></span><strong>{growth}</strong></div>)}<button className="full-link">查看完整竞品报告 <ArrowUpRight size={14} /></button></div></div><div className="panel recommendation"><div className="rec-mark"><WandSparkles size={17} /></div><div><span className="eyebrow">给设计的建议</span><h3>把“轻”做成触感，而不只是视觉。</h3><p>建议在袖口与侧袋加入柔软弹力收口，主面料选用 40D 防泼水棉感布，内里保持亲肤。</p></div><button className="button dark" onClick={onRun}>带入 AI 设计 <ArrowUpRight size={16} /></button></div></>;
}

function DesignStudio({ selected, setSelected, prompt, setPrompt, notify, isRunning }: { selected: number; setSelected: (v: number) => void; prompt: string; setPrompt: (v: string) => void; notify: (m: string, t?: Toast['tone']) => void; isRunning: boolean }) {
  const [filter, setFilter] = useState('全部');
  return <><PageHeader eyebrow="AGENT 02 / GENERATIVE DESIGN" title="AI 设计工作台" copy="先描述你想要的感觉，剩下的交给云麓。" action={<button className="button primary" onClick={() => notify('已保存当前设计为版本 04') }><Check size={17} />保存为版本</button>}><button className="quiet-button" onClick={() => notify('已打开设计版本历史', 'info')}><RotateCcw size={15} />版本历史</button></PageHeader><div className="design-layout"><div className="design-canvas"><div className="canvas-toolbar"><div className="segmented">{['全部','平铺','穿着','细节'].map((x) => <button key={x} className={filter === x ? 'selected' : ''} onClick={() => setFilter(x)}>{x}</button>)}</div><span>4 个方向 · 已完成面料与版型约束</span><button className="icon-button"><SlidersHorizontal size={16} /></button></div><div className="design-grid">{designImages.map((item, i) => <button key={item.title} className={`design-card ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)}><div className="design-visual"><img src={item.src} alt={item.title} /><div className="visual-shade" /><div className="render-badge"><Sparkles size={11} />AI 方案 0{i + 1}</div><div className="render-specs"><span>可生产性 {88 - i * 3}%</span><span>预计成本 ¥{86 + i * 9}</span></div><div className={`render-color color-${i + 1}`}><i /><i /><i /></div></div><div className="design-card-meta"><span>{String(i + 1).padStart(2,'0')}</span><b>{item.title}</b><small>{item.tag}</small>{selected === i && <span className="selected-mark"><Check size={13} /></span>}</div></button>)}</div><div className="canvas-footer"><span><span className="status-dot" />已选择方向 {String(selected + 1).padStart(2,'0')} · 自动保存</span><button className="quiet-button" onClick={() => notify('已下载设计稿 PNG', 'info')}><Download size={15} />下载设计稿</button></div></div><aside className="design-inspector"><div className="inspector-tabs"><button className="active">创作</button><button>参数</button></div><div className="material-upload"><div className="material-preview"><img src="assets/fabric.jpg" alt="上传的面料参考" /></div><div><span className="eyebrow">参考面料</span><b>奶油棉感 · 40D</b><small>已识别 · 亲肤 / 防泼水</small></div><button className="icon-button"><MoreHorizontal size={16} /></button></div><div className="function-status"><span className="eyebrow">本轮 AI 正在使用</span><div><span><Gauge size={13} />市场趋势约束<Check size={12} /></span><span><Package size={13} />面料属性识别<Check size={12} /></span><span><FileText size={13} />基础版型约束<Check size={12} /></span><span><CreditCard size={13} />单款成本预估<Check size={12} /></span></div></div><label className="field-label">告诉 AI 你想怎么改</label><div className="prompt-box"><textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} /><div className="prompt-tools"><button onClick={() => setPrompt(prompt + ' 领口更利落一些。')}><Sparkles size={14} />智能建议</button><span>{prompt.length}/240</span></div></div><div className="quick-prompts"><span>试试这些</span><button onClick={() => setPrompt('把整体色彩改为高饱和电光蓝，加入撞色结构线。')}>夸张配色</button><button onClick={() => setPrompt('增加可拆卸风帽、立体口袋和反光织带。')}>强化功能</button></div><button className={`generate-button ${isRunning ? 'running' : ''}`} onClick={() => notify('已提交新一轮修改，稍后查看结果', 'info')}><WandSparkles size={17} />{isRunning ? '生成中…' : '生成新一轮'}</button><div className="inspector-note"><Zap size={14} /><span>每轮生成都会保留方案、参数和成本版本，可随时回退。</span></div></aside></div></>;
}

function Preview({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  const [view, setView] = useState('联合视图');
  const [scale, setScale] = useState(92);
  return <><PageHeader eyebrow="AGENT 03–04 / DIGITAL SAMPLE REVIEW" title="数字样衣评审" copy="把真人试穿、3D 数字样衣、纸样和尺寸放在同一个决策界面里。" action={<button className="button primary" onClick={() => notify('版本 V04 已确认，纸样已锁定并进入人工打样')}><Check size={17} />确认并送样</button>}><button className="quiet-button" onClick={() => notify('纸样 PDF 已导出', 'info')}><Download size={15} />导出纸样</button></PageHeader><div className="review-toolbar"><div className="segmented">{['联合视图','3D 样衣','试穿样本','2D 纸样'].map((x) => <button key={x} className={view === x ? 'selected' : ''} onClick={() => { setView(x); notify(`已切换至${x}`, 'info'); }}>{x}</button>)}</div><div className="review-sync"><span><span className="status-dot" />三个视图实时联动</span><button className="quiet-button" onClick={() => notify('批注模式已开启', 'info')}><SlidersHorizontal size={15} />添加批注</button><button className="icon-button" onClick={() => notify('评审记录已打开', 'info')}><MoreHorizontal size={17} /></button></div></div><div className="unified-review"><div className="review-board"><img src="assets/digital-sample-review.png" alt="真人试穿、3D 数字样衣与 2D 纸样联合评审图" style={{ transform: `scale(${scale / 100})` }} /><div className="board-zoom"><button className="icon-button" onClick={() => setScale(Math.max(76, scale - 4))}>−</button><span>{scale}%</span><button className="icon-button" onClick={() => setScale(Math.min(108, scale + 4))}>+</button></div></div><aside className="review-inspector"><div className="panel review-summary"><div className="panel-heading"><div><span className="eyebrow">REVIEW SUMMARY</span><h3>本轮评审结论</h3></div><span className="confidence">完成度 92%</span></div><div className="review-score"><div><strong>3</strong><span>处尺寸修改</span></div><div><strong>1</strong><span>项待版师确认</span></div><div><strong>0</strong><span>项生产风险</span></div></div><div className="review-findings"><button onClick={() => notify('已定位到袖长批注', 'info')}><span className="finding-dot warn" /><span><b>袖长建议缩短 1.5 cm</b><small>来自真人试穿样本 · 高置信</small></span><ChevronRight size={15} /></button><button onClick={() => notify('已定位到胸围批注', 'info')}><span className="finding-dot info" /><span><b>胸围活动量增加 2.4 cm</b><small>3D 动作模拟 · 中高置信</small></span><ChevronRight size={15} /></button><button onClick={() => notify('已定位到罗纹批注', 'info')}><span className="finding-dot good" /><span><b>下摆罗纹弹性通过</b><small>纸样参数与面料属性匹配</small></span><ChevronRight size={15} /></button></div></div><div className="panel review-actions"><div className="panel-heading"><div><span className="eyebrow">VERSION V04</span><h3>下一步</h3></div><Clock3 size={17} color="#8c83cf" /></div><p>确认后将锁定当前 3D 参数与纸样尺寸，并创建人工打样断点。</p><button className="button dark" onClick={() => notify('已创建人工打样任务，等待样衣上传', 'info')}>创建打样任务 <ArrowUpRight size={15} /></button><button className="full-link" onClick={() => notify('已回退到版本 V03', 'info')}><RotateCcw size={14} />回退到上一版本</button></div></aside></div></>;
}

function Pattern({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  return <><PageHeader eyebrow="AGENT 04 / PATTERN OUTPUT" title="纸板版型" copy="让确认过的设计，拥有一份可以交给工厂的语言。" action={<button className="button primary" onClick={() => notify('纸板 PDF 已开始生成，请稍候', 'info')}><FileText size={17} />生成纸板 PDF</button>}><button className="quiet-button" onClick={() => notify('版型模板已打开', 'info')}><FolderOpen size={15} />模板库</button></PageHeader><div className="pattern-layout"><div className="pattern-preview"><div className="paper-toolbar"><span>奶油云朵_轻户外卫衣_v03.pdf</span><span><button className="icon-button"><Download size={15} /></button><button className="icon-button"><MoreHorizontal size={15} /></button></span></div><div className="paper"><div className="paper-title">云麓童装 · 试制纸样 <small>YUNLU STUDIO</small></div><div className="pattern-shape left"><span>前片<br /><small>FRONT</small></span></div><div className="pattern-shape right"><span>后片<br /><small>BACK</small></span></div><div className="paper-line" /><div className="paper-scale">100 mm 校准线</div><div className="paper-footer">款号 YL-24AW-021 · 尺码 110 · 缝份 1 cm · Grainline ↑</div></div><div className="paper-pages"><span className="active">1 / 4</span><button className="icon-button"><ChevronLeft size={15} /></button><button className="icon-button"><ChevronRight size={15} /></button></div></div><aside className="pattern-side"><div className="panel spec-panel"><div className="panel-heading"><div><span className="eyebrow">PATTERN SPECS</span><h3>版型参数</h3></div><button className="quiet-button">编辑</button></div>{[['版型','轻户外卫衣'],['尺码','90 · 100 · 110 · 120'],['面料幅宽','150 cm'],['缝份','1 cm']].map(([a,b]) => <div className="spec-row" key={a}><span>{a}</span><b>{b}</b></div>)}<div className="review-note"><Check size={15} /><span>模板已通过版师初审<br /><small>建议完成实体试制后再投入生产</small></span></div></div><div className="checkpoint"><div className="checkpoint-icon"><Pause size={17} /></div><div><span className="eyebrow">NEXT CHECKPOINT</span><h3>等待人工打样</h3><p>下载纸板，交给工厂完成第一件样衣。回来后上传平拍图，继续生成营销内容。</p><button className="button dark" onClick={() => notify('已进入人工打样断点', 'info')}>标记为已送样 <ArrowUpRight size={15} /></button></div></div></aside></div></>;
}

function Marketing({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  const [tab, setTab] = useState('文案');
  return <><PageHeader eyebrow="AGENT 05 / MARKETING CONTENT" title="营销内容" copy="样衣回来以后，让每一处细节都值得被看见。" action={<button className="button primary" onClick={() => notify('已提交生成任务，预计 2 分钟完成', 'info')}><Sparkles size={17} />生成营销素材</button>}><button className="quiet-button" onClick={() => notify('素材包已下载', 'info')}><Download size={15} />下载素材包</button></PageHeader><div className="marketing-tabs">{['文案','海报','短视频'].map(x => <button key={x} className={tab === x ? 'active' : ''} onClick={() => setTab(x)}>{x}{x === '短视频' && <span className="beta">BETA</span>}</button>)}</div><div className="marketing-layout"><div className="sample-upload"><div className="sample-image"><img src="assets/sample.jpg" alt="已上传的样衣平拍图" /><div className="sample-overlay"><span><Check size={13} />已上传样衣图</span><button onClick={() => notify('重新上传功能暂未连接后端', 'info')}><Upload size={14} />替换</button></div></div><div className="upload-meta"><span><ImageIcon size={15} />样衣平拍图 · 3.2 MB</span><span>上传于今天 09:42</span></div></div><div className="copy-panel panel"><div className="panel-heading"><div><span className="eyebrow">CONTENT PREVIEW</span><h3>{tab}草稿</h3></div><button className="icon-button" onClick={() => notify('文案已复制到剪贴板', 'info')}><CopyIcon /></button></div>{tab === '文案' ? <><div className="copy-platform"><button className="active">小红书</button><button>抖音</button><button>详情页</button></div><div className="copy-content"><h4>孩子的秋天，应该轻一点。</h4><p>一件可以从公园穿到晚餐的轻户外卫衣。柔软的奶油棉感面料，挡住微风，也把活动的自由留给孩子。</p><p>我们把帽子、袖口和侧袋都做得刚刚好：不厚重，有一点点功能，但更像每天都愿意穿的那件衣服。</p><div className="hashes">#云麓童装 #轻户外童装 #秋冬穿搭 #小小探险家</div></div><div className="copy-actions"><button className="button dark" onClick={() => notify('已复制小红书文案', 'info')}>复制文案</button><button className="quiet-button" onClick={() => notify('正在生成另一版语气', 'info')}><RotateCcw size={15} />换一种语气</button></div></> : <div className="empty-tab"><Sparkles size={24} /><b>{tab}将在样衣确认后生成</b><span>点击右上角开始一次新的生成任务</span></div>}</div></div></>;
}

function CopyIcon() { return <span className="copy-icon">↗</span>; }

function Billing({ notify }: { notify: (m: string, t?: Toast['tone']) => void }) {
  return <><PageHeader eyebrow="ACCOUNT / SUBSCRIPTION" title="账单与会员" copy="让创作持续发生，也让每一笔成本清晰可见。" action={<button className="button primary" onClick={() => notify('套餐升级流程暂未连接支付', 'info')}><Zap size={17} />升级会员</button>} /><div className="billing-hero"><div><span className="eyebrow">当前会员计划</span><h2>标准版 <i>·</i> Standard</h2><p>有效期至 2024 年 12 月 31 日 · Agent 01–04 无限使用</p></div><div className="billing-price"><strong>¥3,799</strong><span>/ 月</span></div></div><div className="billing-grid"><div className="panel billing-usage"><div className="panel-heading"><div><span className="eyebrow">AUGUST 2024</span><h3>本月用量</h3></div><button className="quiet-button" onClick={() => notify('用量报表已导出', 'info')}><Download size={15} />导出</button></div><div className="usage-metrics"><div><span>完成款式</span><b>12 <small>/ 50</small></b><i className="metric-progress"><em style={{ width: '24%' }} /></i></div><div><span>AI 设计轮次</span><b>38 <small>次</small></b><i className="metric-progress"><em style={{ width: '64%' }} /></i></div><div><span>营销素材</span><b>8 <small>款</small></b><i className="metric-progress"><em style={{ width: '32%' }} /></i></div></div></div><div className="panel invoices"><div className="panel-heading"><h3>最近账单</h3><button className="icon-button"><MoreHorizontal size={17} /></button></div>{[['2024.08.01','标准版会员月费','¥3,799','已支付'],['2024.07.12','营销内容 · 轻户外卫衣','¥20','已支付'],['2024.07.04','营销内容 · 城市漫游','¥20','已支付']].map(([date,name,price,status]) => <div className="invoice-row" key={date + name}><span>{date}</span><b>{name}</b><strong>{price}</strong><small><Check size={12} />{status}</small></div>)}</div></div></>;
}

function CommandPalette({ close, navigate }: { close: () => void; navigate: (view: View) => void }) {
  const options: [View,string,string][] = [['overview','回到款式总览','⌘ 1'],['insights','打开市场洞察','⌘ 2'],['design','打开 AI 设计工作台','⌘ 3'],['preview','打开数字样衣评审','⌘ 4'],['marketing','打开营销内容','⌘ 5'],['billing','打开账单与会员','⌘ 6']];
  return <div className="modal-backdrop" onMouseDown={close}><div className="command-palette" onMouseDown={(e) => e.stopPropagation()}><div className="command-search"><Search size={18} /><input autoFocus placeholder="搜索工作台…" /><kbd>ESC</kbd></div>{options.map(([view,label,key]) => <button key={view} onClick={() => navigate(view)}><span className="command-icon"><ArrowUpRight size={15} /></span><span>{label}</span><kbd>{key}</kbd></button>)}<div className="command-footer"><span>快速打开页面</span><span><kbd>↑↓</kbd>选择 <kbd>↵</kbd>确认</span></div></div></div>;
}

function NewProduct({ close, create }: { close: () => void; create: () => void }) {
  const [name, setName] = useState('春日轻户外');
  return <div className="modal-backdrop" onMouseDown={close}><div className="new-modal" onMouseDown={(e) => e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">NEW PROJECT</span><h2>新建一个款式</h2></div><button className="icon-button" onClick={close}><X size={18} /></button></div><label>款式名称<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>品类<div className="select-like">卫衣 <ChevronDown size={15} /></div></label><label>面向年龄<div className="select-like">3–6 岁 <ChevronDown size={15} /></div></label><div className="modal-foot"><button className="quiet-button" onClick={close}>取消</button><button className="button primary" onClick={create}><Plus size={16} />创建款式</button></div></div></div>;
}

export default App;
