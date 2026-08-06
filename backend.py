"""Yunlu Studio demo backend.

This is deliberately dependency-light for customer demos: SQLite replaces
PostgreSQL, local files replace OSS/COS, and deterministic agent adapters
replace paid AI providers. The API contracts are shaped so those adapters can
be swapped without changing the front-end workflow.
"""

from __future__ import annotations

import json
import os
import csv
import io
import secrets
import sqlite3
import time
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parent
RUNTIME = ROOT / "runtime_storage"
RUNTIME.mkdir(exist_ok=True)
DB_PATH = RUNTIME / "yunlu_demo.sqlite3"
DIST = ROOT / "dist"

app = FastAPI(title="Yunlu Studio Demo API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


STATES = [
    "draft", "market_researched", "designed", "3d_confirmed", "pattern_exported",
    "awaiting_sample", "sample_uploaded", "marketing_generated", "strategy_ready", "archived",
]
AGENTS = {
    "agent1": "市场情报",
    "agent2": "AI 设计生成",
    "agent3": "3D 效果与微调",
    "agent4": "纸板版型输出",
    "agent5": "营销内容生成",
    "agent6": "营销策略方案",
    "agent7": "企业数据整合",
    "agent8": "销售数据分析",
}
STATE_AFTER_AGENT = {
    "agent1": "market_researched", "agent2": "designed", "agent3": "3d_confirmed",
    "agent4": "pattern_exported", "agent5": "marketing_generated", "agent6": "strategy_ready",
    "agent8": "strategy_ready",
}


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def query(sql: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    with db() as conn:
        return [dict(row) for row in conn.execute(sql, params).fetchall()]


def one(sql: str, params: tuple[Any, ...] = ()) -> dict[str, Any] | None:
    rows = query(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple[Any, ...] = ()) -> int:
    with db() as conn:
        cur = conn.execute(sql, params)
        conn.commit()
        return cur.lastrowid


def json_load(value: str | None) -> Any:
    if not value:
        return None
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return value


def init_db() -> None:
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              id TEXT PRIMARY KEY, phone TEXT UNIQUE, name TEXT, company TEXT,
              plan TEXT NOT NULL DEFAULT 'standard', created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS subscriptions (
              id TEXT PRIMARY KEY, user_id TEXT NOT NULL, plan TEXT NOT NULL,
              monthly_fee INTEGER NOT NULL, unit_fee INTEGER NOT NULL,
              status TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
              FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS products (
              id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL,
              category TEXT NOT NULL, age_range TEXT NOT NULL, status TEXT NOT NULL,
              current_version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS product_versions (
              id TEXT PRIMARY KEY, product_id TEXT NOT NULL, version_no INTEGER NOT NULL,
              summary TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL,
              FOREIGN KEY(product_id) REFERENCES products(id)
            );
            CREATE TABLE IF NOT EXISTS agent_runs (
              id TEXT PRIMARY KEY, product_id TEXT NOT NULL, agent TEXT NOT NULL,
              status TEXT NOT NULL, input_json TEXT, output_json TEXT,
              duration_ms INTEGER, cost_estimate REAL NOT NULL DEFAULT 0,
              error_message TEXT, created_at TEXT NOT NULL,
              FOREIGN KEY(product_id) REFERENCES products(id)
            );
            CREATE TABLE IF NOT EXISTS checkpoints (
              id TEXT PRIMARY KEY, product_id TEXT NOT NULL, kind TEXT NOT NULL,
              status TEXT NOT NULL, note TEXT, resumed_at TEXT, created_at TEXT NOT NULL,
              FOREIGN KEY(product_id) REFERENCES products(id)
            );
            CREATE TABLE IF NOT EXISTS assets (
              id TEXT PRIMARY KEY, product_id TEXT NOT NULL, kind TEXT NOT NULL,
              filename TEXT NOT NULL, storage_key TEXT NOT NULL, url TEXT NOT NULL,
              lifecycle TEXT NOT NULL DEFAULT 'hot', created_at TEXT NOT NULL,
              FOREIGN KEY(product_id) REFERENCES products(id)
            );
            CREATE TABLE IF NOT EXISTS market_reports (
              id TEXT PRIMARY KEY, product_id TEXT NOT NULL, keyword TEXT NOT NULL,
              report_json TEXT NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL,
              FOREIGN KEY(product_id) REFERENCES products(id)
            );
            CREATE TABLE IF NOT EXISTS marketing_contents (
              id TEXT PRIMARY KEY, product_id TEXT NOT NULL, content_type TEXT NOT NULL,
              content_json TEXT NOT NULL, created_at TEXT NOT NULL,
              FOREIGN KEY(product_id) REFERENCES products(id)
            );
            CREATE TABLE IF NOT EXISTS sales_records (
              id TEXT PRIMARY KEY, product_id TEXT NOT NULL, channel TEXT NOT NULL,
              units INTEGER NOT NULL, revenue REAL NOT NULL, period TEXT NOT NULL,
              created_at TEXT NOT NULL, FOREIGN KEY(product_id) REFERENCES products(id)
            );
            CREATE TABLE IF NOT EXISTS billing_records (
              id TEXT PRIMARY KEY, user_id TEXT NOT NULL, product_id TEXT,
              description TEXT NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL,
              provider TEXT NOT NULL, created_at TEXT NOT NULL,
              FOREIGN KEY(user_id) REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS audit_events (
              id TEXT PRIMARY KEY, product_id TEXT, action TEXT NOT NULL,
              detail_json TEXT, created_at TEXT NOT NULL
            );
            """
        )
    seed_demo()


def seed_demo() -> None:
    user = one("SELECT * FROM users LIMIT 1")
    if user and one("SELECT * FROM products LIMIT 1"):
        return
    user_id = "user_demo"
    if not user:
        execute("INSERT INTO users VALUES (?,?,?,?,?,?)", (user_id, "13800000000", "林小满", "云麓童装", "standard", now()))
    if not one("SELECT 1 FROM subscriptions LIMIT 1"):
        execute("INSERT INTO subscriptions VALUES (?,?,?,?,?,?,?,?)", ("sub_demo", user_id, "standard", 3799, 20, "active", "2024-12-31T23:59:59+08:00", now()))
    product_id = "product_demo"
    execute("INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?)", (product_id, user_id, "奶油云朵 · 轻户外卫衣", "卫衣", "3-6岁", "designed", 4, now(), now()))
    execute("INSERT INTO product_versions VALUES (?,?,?,?,?,?)", ("version_demo", product_id, 4, "蓝色针织外套 V04", json.dumps({"selected_design": 1, "material": "奶油棉感 40D"}, ensure_ascii=False), now()))
    execute("INSERT INTO assets VALUES (?,?,?,?,?,?,?,?)", ("asset_review", product_id, "digital_review", "digital-sample-review.png", "digital-sample-review.png", "/assets/digital-sample-review.png", "hot", now()))
    execute("INSERT INTO market_reports VALUES (?,?,?,?,?,?)", ("report_demo", product_id, "轻户外童装 / 3-6岁 / 秋冬", json.dumps({"hot_categories": ["轻户外卫衣", "软壳马甲"], "silhouette": ["宽松短款", "轻机能"], "colors": ["奶油白", "电光蓝", "鼠尾草绿"], "materials": ["防泼水棉感", "轻量针织"], "craft": ["撞色结构线", "反光织带"], "competitors": ["Mini Rodini", "Bobo Choses"]}, ensure_ascii=False), "公开趋势模拟数据 + LLM 总结", now()))


def product_or_404(product_id: str) -> dict[str, Any]:
    product = one("SELECT * FROM products WHERE id=?", (product_id,))
    if not product:
        raise HTTPException(404, "product not found")
    return product


def log_event(product_id: str | None, action: str, detail: Any = None) -> None:
    execute("INSERT INTO audit_events VALUES (?,?,?,?,?)", (str(uuid.uuid4()), product_id, action, json.dumps(detail, ensure_ascii=False) if detail is not None else None, now()))


def set_status(product_id: str, status: str) -> None:
    execute("UPDATE products SET status=?, updated_at=? WHERE id=?", (status, now(), product_id))
    log_event(product_id, "status_changed", {"status": status})


class CreateProduct(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    category: str = "卫衣"
    age_range: str = "3-6岁"


class AgentInput(BaseModel):
    keyword: str | None = None
    prompt: str | None = None
    category: str | None = None
    mode: str = "mock"
    payload: dict[str, Any] = Field(default_factory=dict)


class Checkout(BaseModel):
    plan: str = "standard"
    provider: str = "mock-wechat"


class SaleInput(BaseModel):
    channel: str = "小红书"
    units: int = 24
    revenue: float = 4560
    period: str = "2024-08"


class ChatInput(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    context: str = "童装产品全流程"


def openai_text(instructions: str, prompt: str) -> tuple[str | None, str]:
    """Use OpenAI when configured; keep the customer demo usable offline."""
    if not os.getenv("OPENAI_API_KEY"):
        return None, "本地演示数据"
    try:
        from openai import OpenAI
        response = OpenAI().responses.create(
            model=os.getenv("OPENAI_MODEL", "gpt-5.6"),
            instructions=instructions,
            input=prompt,
        )
        return response.output_text.strip(), f"OpenAI {os.getenv('OPENAI_MODEL', 'gpt-5.6')}"
    except Exception as exc:
        log_event(None, "openai_fallback", {"error": str(exc)[:300]})
        return None, "本地演示数据（OpenAI 调用失败后回退）"


def report_payload(keyword: str, ai_summary: str | None = None, source: str = "本地演示数据") -> dict[str, Any]:
    return {
        "keyword": keyword,
        "title": "2024 秋冬轻户外童装市场洞察报告",
        "executive_summary": ai_summary or "轻量、跨场景和触感功能化成为核心购买理由。家长更偏好能从通勤、校园自然切换到公园活动的单品。",
        "hot_categories": ["轻户外卫衣 +28%", "软壳马甲 +22%", "针织套装 +19%"],
        "silhouette_trends": ["宽松短款", "可拆卸风帽", "活动型袖窿"],
        "color_trends": ["奶油白", "电光蓝", "鼠尾草绿"],
        "material_trends": ["40D 防泼水棉感", "轻量针织", "亲肤网眼里布"],
        "craft_heat": ["撞色结构线", "反光织带", "立体功能口袋"],
        "competitors": [
            {"brand": "Mini Rodini", "focus": "轻户外胶囊系列", "growth": "+22%"},
            {"brand": "Bobo Choses", "focus": "自然色套装", "growth": "+18%"},
            {"brand": "Konges Sløjd", "focus": "防风软壳", "growth": "+15%"},
        ],
        "design_recommendation": "主推电光蓝与奶油白撞色，采用轻量防泼水面料，保留柔软袖口并增加可拆卸风帽和反光安全细节。",
        "confidence": 0.86,
        "source": source,
        "generated_at": now(),
    }


def markdown_report(report: dict[str, Any]) -> str:
    sections = [
        f"# {report['title']}", f"检索主题：{report['keyword']}", f"生成时间：{report['generated_at']}",
        "## 执行摘要", report["executive_summary"],
        "## 热门品类", *[f"- {x}" for x in report["hot_categories"]],
        "## 廓形趋势", *[f"- {x}" for x in report["silhouette_trends"]],
        "## 色彩趋势", *[f"- {x}" for x in report["color_trends"]],
        "## 面料趋势", *[f"- {x}" for x in report["material_trends"]],
        "## 工艺热度", *[f"- {x}" for x in report["craft_heat"]],
        "## 设计建议", report["design_recommendation"], f"数据来源：{report['source']}",
    ]
    return "\n\n".join(sections) + "\n"


def pdf_report_bytes(report: dict[str, Any]) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
    pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=44, leftMargin=44, topMargin=48, bottomMargin=45)
    styles = getSampleStyleSheet()
    title = ParagraphStyle("YunluTitle", parent=styles["Title"], fontName="STSong-Light", fontSize=23, leading=31, textColor=colors.HexColor("#24252b"), alignment=TA_CENTER)
    h2 = ParagraphStyle("YunluH2", parent=styles["Heading2"], fontName="STSong-Light", fontSize=14, leading=21, textColor=colors.HexColor("#6257d1"), spaceBefore=15)
    body = ParagraphStyle("YunluBody", parent=styles["BodyText"], fontName="STSong-Light", fontSize=10, leading=18, textColor=colors.HexColor("#55575f"))
    story = [Paragraph(report["title"], title), Spacer(1, 8), Paragraph(f"云麓 Studio · {report['keyword']} · 置信度 {int(report['confidence']*100)}%", body), Spacer(1, 18)]
    story += [Paragraph("执行摘要", h2), Paragraph(report["executive_summary"], body)]
    rows = [["热门品类", "廓形", "色彩", "面料"], ["<br/>".join(report["hot_categories"]), "<br/>".join(report["silhouette_trends"]), "<br/>".join(report["color_trends"]), "<br/>".join(report["material_trends"])]]
    table = Table([[Paragraph(cell, body) for cell in row] for row in rows], colWidths=[120]*4, hAlign="LEFT")
    table.setStyle(TableStyle([("BACKGROUND", (0,0), (-1,0), colors.HexColor("#eeedff")), ("GRID", (0,0), (-1,-1), .4, colors.HexColor("#dedee6")), ("VALIGN", (0,0), (-1,-1), "TOP"), ("LEFTPADDING", (0,0), (-1,-1), 9), ("RIGHTPADDING", (0,0), (-1,-1), 9), ("TOPPADDING", (0,0), (-1,-1), 9), ("BOTTOMPADDING", (0,0), (-1,-1), 9)]))
    story += [Spacer(1, 14), table, Paragraph("竞品动向", h2)]
    for item in report["competitors"]:
        story.append(Paragraph(f"{item['brand']} · {item['focus']} · {item['growth']}", body))
    story += [Paragraph("给设计的建议", h2), Paragraph(report["design_recommendation"], body), Spacer(1, 18), Paragraph(f"数据来源：{report['source']} | 生成时间：{report['generated_at']}", body)]
    doc.build(story)
    return buffer.getvalue()


@app.on_event("startup")
def startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "mode": "demo", "database": "sqlite", "storage": "local", "timestamp": now()}


@app.post("/api/auth/demo-login")
def demo_login() -> dict[str, Any]:
    user = one("SELECT * FROM users LIMIT 1")
    return {"access_token": secrets.token_urlsafe(24), "token_type": "bearer", "user": user}


@app.get("/api/me")
def me() -> dict[str, Any]:
    return one("SELECT * FROM users LIMIT 1") or {}


@app.get("/api/products")
def products() -> list[dict[str, Any]]:
    return query("SELECT * FROM products ORDER BY updated_at DESC")


@app.post("/api/products")
def create_product(payload: CreateProduct) -> dict[str, Any]:
    product_id = "product_" + uuid.uuid4().hex[:10]
    t = now()
    execute("INSERT INTO products VALUES (?,?,?,?,?,?,?,?,?)", (product_id, "user_demo", payload.name, payload.category, payload.age_range, "draft", 1, t, t))
    execute("INSERT INTO product_versions VALUES (?,?,?,?,?,?)", (str(uuid.uuid4()), product_id, 1, "新款草稿", json.dumps(payload.model_dump(), ensure_ascii=False), t))
    log_event(product_id, "product_created", payload.model_dump())
    return product_or_404(product_id)


@app.get("/api/products/{product_id}")
def get_product(product_id: str) -> dict[str, Any]:
    product = product_or_404(product_id)
    product["versions"] = query("SELECT * FROM product_versions WHERE product_id=? ORDER BY version_no DESC", (product_id,))
    product["runs"] = query("SELECT * FROM agent_runs WHERE product_id=? ORDER BY created_at DESC", (product_id,))
    product["checkpoints"] = query("SELECT * FROM checkpoints WHERE product_id=? ORDER BY created_at DESC", (product_id,))
    product["assets"] = query("SELECT * FROM assets WHERE product_id=? ORDER BY created_at DESC", (product_id,))
    return product


@app.post("/api/products/{product_id}/advance")
def advance(product_id: str, payload: AgentInput | None = None) -> dict[str, Any]:
    product = product_or_404(product_id)
    next_status = STATES[min(STATES.index(product["status"]) + 1, len(STATES) - 1)]
    set_status(product_id, next_status)
    if next_status == "awaiting_sample":
        execute("INSERT INTO checkpoints VALUES (?,?,?,?,?,?,?)", (str(uuid.uuid4()), product_id, "sample", "waiting", "下载纸样并送工厂打样", None, now()))
    return {"product": product_or_404(product_id), "next_status": next_status}


@app.post("/api/products/{product_id}/revert")
def revert(product_id: str) -> dict[str, Any]:
    product = product_or_404(product_id)
    previous = STATES[max(0, STATES.index(product["status"]) - 1)]
    version = product["current_version"] + 1
    execute("UPDATE products SET status=?, current_version=?, updated_at=? WHERE id=?", (previous, version, now(), product_id))
    execute("INSERT INTO product_versions VALUES (?,?,?,?,?,?)", (str(uuid.uuid4()), product_id, version, f"回退到 {previous}", json.dumps({"reverted_from": product["status"]}, ensure_ascii=False), now()))
    log_event(product_id, "version_reverted", {"from": product["status"], "to": previous})
    return product_or_404(product_id)


@app.post("/api/products/{product_id}/pause")
def pause(product_id: str) -> dict[str, Any]:
    product_or_404(product_id)
    log_event(product_id, "workflow_paused")
    return {"ok": True, "status": "paused"}


@app.post("/api/products/{product_id}/resume")
def resume(product_id: str) -> dict[str, Any]:
    product_or_404(product_id)
    log_event(product_id, "workflow_resumed")
    return {"ok": True, "status": "resumed"}


def agent_output(agent: str, product: dict[str, Any], payload: AgentInput) -> tuple[dict[str, Any], float]:
    keyword = payload.keyword or "轻户外童装 / 3-6岁 / 秋冬"
    if agent == "agent1":
        ai_summary, source = openai_text("你是童装市场研究员。只输出一句中文执行摘要，关注趋势、家长购买理由和设计机会。", keyword)
        return (report_payload(keyword, ai_summary, source), 1.2)
    if agent == "agent2":
        prompt = payload.prompt or "柔软、轻机能、适合 3-6 岁儿童"
        ai_summary, source = openai_text("你是童装设计总监。为客户演示生成一句设计解释，指出功能、面料与穿着场景。", prompt)
        return ({"prompt": prompt, "designs": [
            {"id": "D01", "title": "电光蓝探索卫衣", "mode": "穿着", "image": "editorial-01.jpg", "detail": "可拆卸风帽 / 反光织带 / 活动袖窿"},
            {"id": "D02", "title": "奶油拼接轻机能", "mode": "平铺", "image": "editorial-02.jpg", "detail": "撞色结构线 / 立体口袋 / 柔软罗纹"},
            {"id": "D03", "title": "城市漫游样衣", "mode": "3D 数字样衣", "image": "digital-sample-review.png", "detail": "数字面料 / 尺寸联动 / 视图同步"},
            {"id": "D04", "title": "版型细节与纸样", "mode": "细节", "image": "fabric.jpg", "detail": "前后片 / 袖片 / 1cm 缝份"},
        ], "feasibility": [88, 85, 92, 90], "estimated_cost": [86, 95, 104, 113], "ai_explanation": ai_summary or "以轻量防泼水面料承载电光蓝撞色，让功能细节成为日常穿着的一部分。", "source": source}, 0.6)
    if agent == "agent3":
        return ({"mode": payload.mode, "digital_sample": "digital-sample-review.png", "linked_views": ["try_on", "3d", "2d_pattern"], "annotations": ["领深 -0.8 cm", "胸围活动量 +2.4 cm", "袖长 -1.5 cm"], "confidence": 0.92}, 2.4 if payload.mode == "fast" else 7.5)
    if agent == "agent4":
        return ({"template": product["category"], "sizes": ["90", "100", "110", "120"], "pieces": ["前片", "后片", "袖片", "罗纹"], "seam_allowance_cm": 1, "calibration_mm": 100, "pdf": "pattern-preview.pdf", "pdf_url": "/assets/pattern-preview.pdf", "production_note": "试制版：完成实体试制与版师复核后再投入生产"}, 3.0)
    if agent == "agent5":
        copy = {"xiaohongshu": "孩子的秋天，应该轻一点。柔软的针织和一点刚好的功能，让一件衣服从公园穿到晚餐。\n\n#云麓童装 #轻户外童装 #秋冬穿搭", "douyin": "轻一点，跑远一点。可拆卸风帽、反光织带和防泼水面料，陪孩子把秋天穿得更远。", "detail_page": "轻户外针织外套，亲肤、防泼水、活动量友好。支持 90-120 多尺码，适合城市通勤与周末户外。"}
        ai_copy, source = openai_text("你是童装品牌内容总监。用中文生成适合小红书、抖音和商品详情页的短文案。", "产品：奶油云朵轻户外卫衣；功能：防泼水、轻量针织、可拆卸风帽；语气：简洁高级。")
        if ai_copy:
            copy["xiaohongshu"] = ai_copy
        return ({"copy": copy, "posters": ["01-从灵感到成衣.png", "02-AI设计工作台.png", "03-数字样衣评审.png"], "videos": [{"duration":"15s", "storyboard":["面料特写","穿着跑动","功能细节"]}, {"duration":"30s", "storyboard":["趋势开场","3D 到真人试穿","购买理由"]}, {"duration":"60s", "storyboard":["设计过程","样衣评审","品牌收束"]}], "source": source}, 0.8)
    if agent == "agent6":
        return ({"target_audience": ["3-6岁儿童家长", "重视舒适与户外活动的城市家庭"], "pricing": "建议零售价 ¥169-199", "channels": ["小红书种草", "抖音短视频", "详情页转化"], "cadence": ["预热 3 天", "首发 7 天", "复购 14 天"]}, 1.1)
    if agent == "agent7":
        return ({"archive": {"design_versions": 4, "assets": 8, "runs": 12, "documents": ["market_report", "pattern_pdf", "sample_photo"]}, "tags": ["2024AW", "轻户外", "3-6岁", "针织"], "storage": "local-demo / 可替换 OSS-COS"}, 1.0)
    if agent == "agent8":
        sales = query("SELECT * FROM sales_records WHERE product_id=?", (product["id"],))
        return ({"sales_summary": {"units": sum(x["units"] for x in sales) or 24, "revenue": sum(x["revenue"] for x in sales) or 4560}, "winner_signals": ["电光蓝配色", "轻量针织", "可活动袖窿"], "slow_sellers": ["过厚内里", "复杂装饰"], "feedback_to_agent1": {"add": ["轻量保暖", "蓝色高对比"], "reduce": ["厚重填充"]}}, 1.0)
    raise HTTPException(400, f"unknown agent: {agent}")


@app.post("/api/products/{product_id}/agents/{agent}")
def run_agent(product_id: str, agent: str, payload: AgentInput | None = None) -> dict[str, Any]:
    product = product_or_404(product_id)
    if agent not in AGENTS:
        raise HTTPException(404, "agent not found")
    payload = payload or AgentInput()
    run_id = str(uuid.uuid4())
    started = time.perf_counter()
    try:
        output, cost = agent_output(agent, product, payload)
        duration = int((time.perf_counter() - started) * 1000) + 180
        execute("INSERT INTO agent_runs VALUES (?,?,?,?,?,?,?,?,?,?)", (run_id, product_id, agent, "succeeded", json.dumps(payload.model_dump(), ensure_ascii=False), json.dumps(output, ensure_ascii=False), duration, cost, None, now()))
        if agent == "agent1":
            execute("INSERT INTO market_reports VALUES (?,?,?,?,?,?)", (str(uuid.uuid4()), product_id, payload.keyword or "轻户外童装", json.dumps(output, ensure_ascii=False), output["source"], now()))
        if agent == "agent5":
            for kind in ("copy", "poster", "video"):
                execute("INSERT INTO marketing_contents VALUES (?,?,?,?,?)", (str(uuid.uuid4()), product_id, kind, json.dumps(output, ensure_ascii=False), now()))
        if agent in STATE_AFTER_AGENT:
            set_status(product_id, STATE_AFTER_AGENT[agent])
        log_event(product_id, "agent_completed", {"agent": agent, "run_id": run_id, "cost": cost})
        return {"run_id": run_id, "agent": agent, "label": AGENTS[agent], "status": "succeeded", "duration_ms": duration, "cost_estimate": cost, "output": output, "product": product_or_404(product_id)}
    except Exception as exc:
        execute("INSERT INTO agent_runs VALUES (?,?,?,?,?,?,?,?,?,?)", (run_id, product_id, agent, "failed", json.dumps(payload.model_dump(), ensure_ascii=False), None, 0, 0, str(exc), now()))
        raise


@app.post("/api/products/{product_id}/sample-upload")
async def sample_upload(product_id: str, file: UploadFile | None = File(default=None)) -> dict[str, Any]:
    product_or_404(product_id)
    filename = file.filename if file else "sample-photo-demo.jpg"
    content = await file.read() if file else b"demo sample photo"
    safe_name = f"{uuid.uuid4().hex[:10]}-{Path(filename).name}"
    storage_path = RUNTIME / safe_name
    storage_path.write_bytes(content)
    asset_id = str(uuid.uuid4())
    execute("INSERT INTO assets VALUES (?,?,?,?,?,?,?)", (asset_id, product_id, "sample_photo", filename, safe_name, f"/api/assets/{asset_id}/download", "hot", now()))
    execute("UPDATE checkpoints SET status='resumed', resumed_at=? WHERE product_id=? AND kind='sample' AND status='waiting'", (now(), product_id))
    set_status(product_id, "sample_uploaded")
    log_event(product_id, "sample_uploaded", {"filename": filename})
    return {"asset_id": asset_id, "filename": filename, "status": "sample_uploaded", "recognized": {"garment": "针织外套", "confidence": 0.94}, "product": product_or_404(product_id)}


@app.get("/api/assets/{asset_id}/download")
def download_asset(asset_id: str) -> FileResponse:
    asset = one("SELECT * FROM assets WHERE id=?", (asset_id,))
    if not asset:
        raise HTTPException(404, "asset not found")
    path = RUNTIME / asset["storage_key"]
    if not path.exists():
        path = ASSET_PATH(asset["filename"])
    if not path or not path.exists():
        raise HTTPException(404, "asset file not found")
    return FileResponse(path, filename=asset["filename"])


def ASSET_PATH(filename: str) -> Path | None:
    candidate = ROOT / "public" / "assets" / filename
    return candidate if candidate.exists() else None


@app.post("/api/products/{product_id}/demo-run")
def demo_run(product_id: str) -> dict[str, Any]:
    product_or_404(product_id)
    sequence = []
    for agent, payload in [("agent1", AgentInput(keyword="轻户外童装 / 3-6岁 / 秋冬")), ("agent2", AgentInput(prompt="高饱和撞色、柔软针织、可拆卸风帽")), ("agent3", AgentInput(mode="fast")), ("agent4", AgentInput()), ("agent5", AgentInput()), ("agent6", AgentInput()), ("agent7", AgentInput()), ("agent8", AgentInput())]:
        sequence.append(run_agent(product_id, agent, payload))
    execute("INSERT INTO checkpoints VALUES (?,?,?,?,?,?,?)", (str(uuid.uuid4()), product_id, "sample", "waiting", "演示流程已停在人工打样断点", None, now()))
    set_status(product_id, "awaiting_sample")
    return {"ok": True, "workflow": sequence, "checkpoint": {"status": "waiting", "label": "等待人工打样"}, "product": product_or_404(product_id)}


@app.get("/api/products/{product_id}/reports")
def reports(product_id: str) -> dict[str, Any]:
    product_or_404(product_id)
    return {"market": query("SELECT * FROM market_reports WHERE product_id=? ORDER BY created_at DESC", (product_id,)), "marketing": query("SELECT * FROM marketing_contents WHERE product_id=? ORDER BY created_at DESC", (product_id,)), "sales": query("SELECT * FROM sales_records WHERE product_id=?", (product_id,))}


@app.post("/api/products/{product_id}/market-report")
def generate_market_report(product_id: str, payload: AgentInput | None = None) -> dict[str, Any]:
    payload = payload or AgentInput(keyword="轻户外童装 / 3-6岁 / 秋冬")
    result = run_agent(product_id, "agent1", payload)
    return {"report": result["output"], "run_id": result["run_id"], "export": {"pdf": f"/api/products/{product_id}/market-report/export?format=pdf", "md": f"/api/products/{product_id}/market-report/export?format=md", "csv": f"/api/products/{product_id}/market-report/export?format=csv"}}


@app.get("/api/products/{product_id}/market-report/export")
def export_market_report(product_id: str, format: str = "pdf") -> Response:
    product_or_404(product_id)
    row = one("SELECT * FROM market_reports WHERE product_id=? ORDER BY created_at DESC", (product_id,))
    if not row:
        generated = generate_market_report(product_id)
        report = generated["report"]
    else:
        report = json_load(row["report_json"])
        if not isinstance(report, dict) or "title" not in report:
            report = report_payload(row.get("keyword", "轻户外童装 / 3-6岁 / 秋冬"), source=row.get("source", "本地演示数据"))
    if format == "pdf":
        return Response(pdf_report_bytes(report), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=yunlu-market-report.pdf"})
    if format == "md":
        return Response(markdown_report(report).encode("utf-8"), media_type="text/markdown; charset=utf-8", headers={"Content-Disposition": "attachment; filename=yunlu-market-report.md"})
    if format == "csv":
        stream = io.StringIO(); writer = csv.writer(stream); writer.writerow(["section", "value"])
        for section in ("hot_categories", "silhouette_trends", "color_trends", "material_trends", "craft_heat"):
            for value in report.get(section, []): writer.writerow([section, value])
        return Response(stream.getvalue().encode("utf-8-sig"), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": "attachment; filename=yunlu-market-report.csv"})
    raise HTTPException(400, "format must be pdf, md or csv")


@app.post("/api/products/{product_id}/design-generate")
def design_generate(product_id: str, payload: AgentInput | None = None) -> dict[str, Any]:
    result = run_agent(product_id, "agent2", payload or AgentInput(prompt="柔软亲肤，加入高饱和电光蓝和更多可生产功能"))
    return {"design": result["output"], "run_id": result["run_id"], "export": f"/api/products/{product_id}/design-export"}


@app.get("/api/products/{product_id}/design-export")
def export_design(product_id: str) -> Response:
    product_or_404(product_id)
    runs = query("SELECT output_json FROM agent_runs WHERE product_id=? AND agent='agent2' ORDER BY created_at DESC LIMIT 1", (product_id,))
    design = json_load(runs[0]["output_json"]) if runs else agent_output("agent2", product_or_404(product_id), AgentInput())[0]
    payload = json.dumps(design, ensure_ascii=False, indent=2).encode("utf-8")
    return Response(payload, media_type="application/json", headers={"Content-Disposition": "attachment; filename=yunlu-ai-design-pack.json"})


@app.post("/api/products/{product_id}/content-generate")
def content_generate(product_id: str) -> dict[str, Any]:
    result = run_agent(product_id, "agent5", AgentInput())
    return {"content": result["output"], "run_id": result["run_id"], "export": f"/api/products/{product_id}/marketing-export"}


@app.get("/api/products/{product_id}/marketing-export")
def export_marketing(product_id: str) -> Response:
    product_or_404(product_id)
    rows = query("SELECT content_json FROM marketing_contents WHERE product_id=? ORDER BY created_at DESC LIMIT 1", (product_id,))
    content = json_load(rows[0]["content_json"]) if rows else agent_output("agent5", product_or_404(product_id), AgentInput())[0]
    payload = json.dumps(content, ensure_ascii=False, indent=2).encode("utf-8")
    return Response(payload, media_type="application/json", headers={"Content-Disposition": "attachment; filename=yunlu-marketing-pack.json"})


@app.post("/api/products/{product_id}/chat")
def chat(product_id: str, payload: ChatInput) -> dict[str, Any]:
    product = product_or_404(product_id)
    text, source = openai_text("你是云麓 Studio 的童装产品顾问。请给出可执行、简洁的中文回答。", f"产品：{product['name']}。用户问题：{payload.message}")
    return {"answer": text or "基于当前款式，建议先确认电光蓝撞色、轻量防泼水面料和 1cm 缝份，再进入真人试穿评审。", "source": source}


@app.post("/api/products/{product_id}/sales")
def add_sale(product_id: str, payload: SaleInput) -> dict[str, Any]:
    product_or_404(product_id)
    execute("INSERT INTO sales_records VALUES (?,?,?,?,?,?,?)", (str(uuid.uuid4()), product_id, payload.channel, payload.units, payload.revenue, payload.period, now()))
    return {"ok": True, "sale": payload.model_dump()}


@app.get("/api/billing")
def billing() -> dict[str, Any]:
    return {"subscription": one("SELECT * FROM subscriptions LIMIT 1"), "records": query("SELECT * FROM billing_records ORDER BY created_at DESC"), "usage": {"products": query("SELECT COUNT(*) AS count FROM products")[0]["count"], "agent_runs": query("SELECT COUNT(*) AS count FROM agent_runs")[0]["count"]}}


@app.post("/api/subscriptions/checkout")
def checkout(payload: Checkout) -> dict[str, Any]:
    plans = {"basic": (3299, 25), "standard": (3799, 20), "premium": (4599, 15)}
    fee, unit = plans.get(payload.plan, plans["standard"])
    sub_id = "sub_" + uuid.uuid4().hex[:10]
    execute("INSERT INTO subscriptions VALUES (?,?,?,?,?,?,?,?)", (sub_id, "user_demo", payload.plan, fee, unit, "active", "2025-12-31T23:59:59+08:00", now()))
    execute("INSERT INTO billing_records VALUES (?,?,?,?,?,?,?,?)", (str(uuid.uuid4()), "user_demo", None, f"{payload.plan} 会员月费（{payload.provider} mock）", fee, "paid", payload.provider, now()))
    return {"ok": True, "payment_status": "paid", "subscription_id": sub_id, "amount": fee, "provider": payload.provider}


@app.post("/api/data-lifecycle/run")
def lifecycle_run() -> dict[str, Any]:
    counts = {}
    for lifecycle in ("hot", "warm", "cold"):
        counts[lifecycle] = one("SELECT COUNT(*) AS count FROM assets WHERE lifecycle=?", (lifecycle,))["count"]
    log_event(None, "lifecycle_dry_run", counts)
    return {"mode": "dry_run", "policy": ["会员有效期内 hot", "过期 0-3 月 warm", "过期 3-12 月 cold", "12 月+ delete"], "counts": counts, "recover_endpoint": "/api/assets/{asset_id}/restore"}


@app.post("/api/assets/{asset_id}/restore")
def restore_asset(asset_id: str) -> dict[str, Any]:
    asset = one("SELECT * FROM assets WHERE id=?", (asset_id,))
    if not asset:
        raise HTTPException(404, "asset not found")
    execute("UPDATE assets SET lifecycle='hot' WHERE id=?", (asset_id,))
    return {"ok": True, "asset_id": asset_id, "lifecycle": "hot"}


if DIST.exists():
    @app.get("/assets/{asset_path:path}")
    def compiled_or_demo_asset(asset_path: str):
        compiled = DIST / "assets" / asset_path
        demo_asset = ROOT / "public" / "assets" / asset_path
        poster_asset = ROOT / "outputs" / "posters" / asset_path
        path = compiled if compiled.exists() else (demo_asset if demo_asset.exists() else poster_asset)
        if not path.exists() or not path.is_file():
            raise HTTPException(404, "asset not found")
        return FileResponse(path)

    @app.get("/{path:path}")
    def frontend(path: str = ""):
        requested = DIST / path
        if path and requested.exists() and requested.is_file():
            return FileResponse(requested)
        return FileResponse(DIST / "index.html")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend:app", host="127.0.0.1", port=int(os.getenv("PORT", "8000")), reload=False)
