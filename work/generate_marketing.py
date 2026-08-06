from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas as pdf_canvas
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
OUT = ROOT / "outputs"
POSTERS = OUT / "posters"
PDF_OUT = OUT / "云麓Studio-客户演示手册.pdf"
POSTERS.mkdir(parents=True, exist_ok=True)

FONT_REG = "/System/Library/Fonts/STHeiti Light.ttc"
FONT_BOLD = "/System/Library/Fonts/STHeiti Medium.ttc"


def pil_font(size, bold=False):
    try:
        return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size=size, index=0)
    except OSError:
        return ImageFont.load_default()


def crop(img, size, focus=0.5):
    ratio = max(size[0] / img.width, size[1] / img.height)
    img = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.Resampling.LANCZOS)
    x = max(0, (img.width - size[0]) // 2)
    y = max(0, min(img.height - size[1], int((img.height - size[1]) * focus)))
    return img.crop((x, y, x + size[0], y + size[1]))


def gradient(size, top, bottom):
    out = Image.new("RGB", size)
    d = ImageDraw.Draw(out)
    for y in range(size[1]):
        t = y / max(1, size[1] - 1)
        color = tuple(int(top[i] * (1-t) + bottom[i] * t) for i in range(3))
        d.line((0, y, size[0], y), fill=color)
    return out


def add_brand(d, x, y, dark=False):
    ink = "#ffffff" if dark else "#25272d"
    d.rounded_rectangle((x, y, x+46, y+46), radius=14, fill=ink)
    d.text((x+13, y+8), "云", font=pil_font(23, True), fill="#7771df" if dark else "#ffffff")
    d.text((x+62, y+7), "云麓", font=pil_font(24, True), fill=ink)
    d.text((x+64, y+31), "STUDIO", font=pil_font(8, True), fill="#989aa3" if not dark else "#c8c9d0")


def poster_hero():
    size = (1080, 1350)
    photo = crop(Image.open(ASSETS / "editorial-02.jpg").convert("RGB"), size, .38)
    overlay = Image.new("RGBA", size, (12, 20, 34, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(size[1]):
        a = int(215 * max(0, (y - 420) / 930))
        od.line((0, y, size[0], y), fill=(12, 20, 34, a))
    photo = Image.alpha_composite(photo.convert("RGBA"), overlay).convert("RGB")
    d = ImageDraw.Draw(photo)
    add_brand(d, 70, 60, True)
    d.text((70, 690), "从一块面料，", font=pil_font(56, True), fill="white")
    d.text((70, 760), "到下一款好衣服。", font=pil_font(56, True), fill="#d7d3ff")
    d.text((74, 850), "云麓 AI 童装创作工作台", font=pil_font(24, True), fill="#f0f1f4")
    d.text((74, 898), "市场洞察  ·  AI 设计  ·  数字样衣  ·  纸样打样", font=pil_font(18), fill="#d3d6dd")
    d.rounded_rectangle((70, 1100, 475, 1170), radius=35, fill="#8174e8")
    d.text((103, 1118), "让每一个决定，都更清晰", font=pil_font(22, True), fill="white")
    d.text((74, 1247), "YUNLU STUDIO  /  2024 AW", font=pil_font(15, True), fill="#d5d8df")
    photo.save(POSTERS / "01-从灵感到成衣.png", quality=94)


def poster_design():
    size = (1080, 1350)
    canvas = gradient(size, (247, 246, 251), (224, 224, 239))
    d = ImageDraw.Draw(canvas)
    add_brand(d, 70, 60)
    d.text((70, 190), "AI 设计工作台", font=pil_font(60, True), fill="#25272d")
    d.text((74, 272), "不是随机生成，而是带着市场与面料约束创作。", font=pil_font(22), fill="#777a83")
    cards = [(ASSETS / "editorial-01.jpg", (70, 390, 515, 860), .5), (ASSETS / "kids-fashion.jpg", (565, 390, 1010, 860), .5), (ASSETS / "fabric.jpg", (70, 890, 515, 1190), .54), (ASSETS / "digital-sample-review.png", (565, 890, 1010, 1190), .55)]
    for img_path, rect, focus in cards:
        x0,y0,x1,y1 = rect
        im = crop(Image.open(img_path).convert("RGB"), (x1-x0, y1-y0), focus)
        mask = Image.new("L", im.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((0,0,im.width,im.height), radius=22, fill=255)
        canvas.paste(im, (x0,y0), mask)
    d.rounded_rectangle((95, 420, 285, 465), radius=22, fill=(30,31,38,190))
    d.text((120, 432), "AI 方案 01", font=pil_font(16, True), fill="white")
    d.rounded_rectangle((590, 420, 835, 465), radius=22, fill=(30,31,38,190))
    d.text((615, 432), "穿着效果 / 高饱和拼接", font=pil_font(15, True), fill="white")
    d.text((70, 1240), "一句话修改 · 多轮版本 · 自动保存", font=pil_font(25, True), fill="#4f4d76")
    canvas.save(POSTERS / "02-AI设计工作台.png", quality=94)


def poster_review():
    size = (1080, 1350)
    canvas = Image.new("RGB", size, "#e8e9eb")
    d = ImageDraw.Draw(canvas)
    add_brand(d, 68, 58)
    d.text((68, 155), "数字样衣评审", font=pil_font(55, True), fill="#25272d")
    d.text((72, 232), "把试穿、3D、纸样和尺寸，放在同一个决策界面里。", font=pil_font(20), fill="#777b83")
    board = crop(Image.open(ASSETS / "digital-sample-review.png").convert("RGB"), (944, 690), .48)
    mask = Image.new("L", board.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0,0,board.width,board.height), radius=24, fill=255)
    canvas.paste(board, (68, 340), mask)
    d.rounded_rectangle((68, 1080, 1012, 1170), radius=20, fill="#f9f9fa")
    for i, (title, copy) in enumerate([("真人试穿", "发现袖长与活动量"), ("3D 数字样衣", "实时修改结构细节"), ("2D 纸样", "同步尺寸并导出")]):
        x = 100 + i * 300
        d.ellipse((x, 1108, x+16, 1124), fill=["#75b981", "#8174e8", "#e3a35f"][i])
        d.text((x+29, 1102), title, font=pil_font(17, True), fill="#4e5159")
        d.text((x+29, 1130), copy, font=pil_font(13), fill="#94979f")
    d.text((68, 1245), "确认版本 V04  →  锁定纸样  →  创建人工打样任务", font=pil_font(23, True), fill="#5c56a9")
    canvas.save(POSTERS / "03-数字样衣评审.png", quality=94)


def register_pdf_fonts():
    pdfmetrics.registerFont(TTFont("Yunlu", FONT_REG))
    pdfmetrics.registerFont(TTFont("YunluBold", FONT_BOLD))


def draw_wrapped(c, text, x, y, max_width, size=12, leading=20, color="#6c7078", bold=False):
    c.setFont("YunluBold" if bold else "Yunlu", size)
    c.setFillColor(colors.HexColor(color))
    words = list(text)
    line = ""
    lines = []
    for ch in words:
        if c.stringWidth(line + ch, "YunluBold" if bold else "Yunlu", size) > max_width and line:
            lines.append(line)
            line = ch
        else:
            line += ch
    if line: lines.append(line)
    for item in lines:
        c.drawString(x, y, item)
        y -= leading
    return y


def pdf_page(c, number, eyebrow, title, subtitle):
    width, height = A4
    c.setFillColor(colors.HexColor("#f6f6f8")); c.rect(0,0,width,height,fill=1,stroke=0)
    c.setFillColor(colors.HexColor("#25272d")); c.roundRect(42, height-72, 28, 28, 8, fill=1, stroke=0)
    c.setFillColor(colors.white); c.setFont("YunluBold", 15); c.drawCentredString(56, height-63, "云")
    c.setFillColor(colors.HexColor("#25272d")); c.setFont("YunluBold", 13); c.drawString(80, height-58, "云麓")
    c.setFillColor(colors.HexColor("#a0a2aa")); c.setFont("Yunlu", 7); c.drawString(82, height-68, "STUDIO")
    c.setFillColor(colors.HexColor("#a0a2aa")); c.setFont("YunluBold", 7); c.drawRightString(width-42, height-58, f"{number:02d} / 06")
    c.setFillColor(colors.HexColor("#a1a3ab")); c.setFont("YunluBold", 8); c.drawString(48, height-124, eyebrow.upper())
    c.setFillColor(colors.HexColor("#25272d")); c.setFont("YunluBold", 28); c.drawString(48, height-158, title)
    c.setFillColor(colors.HexColor("#858890")); c.setFont("Yunlu", 11); c.drawString(48, height-180, subtitle)
    c.setStrokeColor(colors.HexColor("#e1e1e4")); c.line(48, 42, width-48, 42)
    c.setFillColor(colors.HexColor("#a0a2aa")); c.setFont("Yunlu", 8); c.drawString(48, 27, "YUNLU STUDIO  ·  客户演示版")


def make_pdf():
    register_pdf_fonts()
    c = pdf_canvas.Canvas(str(PDF_OUT), pagesize=A4)
    width, height = A4
    # Cover
    c.setFillColor(colors.HexColor("#282a31")); c.rect(0,0,width,height,fill=1,stroke=0)
    hero = Image.open(ASSETS / "digital-sample-review.png").convert("RGB")
    hero.thumbnail((width-75, 270), Image.Resampling.LANCZOS)
    c.drawImage(ImageReader(hero), 38, 150, width=width-76, height=hero.height*(width-76)/hero.width, mask="auto")
    c.setFillColor(colors.HexColor("#8174e8")); c.roundRect(48, height-88, 30, 30, 9, fill=1, stroke=0)
    c.setFillColor(colors.white); c.setFont("YunluBold", 16); c.drawCentredString(63, height-78, "云")
    c.setFont("YunluBold", 12); c.drawString(90, height-70, "云麓 STUDIO")
    c.setFont("YunluBold", 29); c.drawString(48, 95, "童装 AI 多智能体创作工作台")
    c.setFont("Yunlu", 12); c.setFillColor(colors.HexColor("#c1c3ca")); c.drawString(50, 70, "从市场洞察，到设计、数字样衣、纸样与营销内容")
    c.showPage()

    # Problem
    pdf_page(c, 2, "Why Yunlu", "把碎片化的经验，变成一条可复用的流程。", "给小微童装品牌一套真正能每天使用的创作工作台")
    cards = [("看趋势", "市场情报不再停留在感觉，而是结构化地进入下一轮设计。", "01"), ("做设计", "一句话、一个面料、一个版型，快速得到可比较的设计方向。", "02"), ("敢打样", "真人试穿、3D 数字样衣、纸样和尺寸在同一个版本里确认。", "03")]
    for i,(title,copy,num) in enumerate(cards):
        y = height-270-i*115
        c.setFillColor(colors.HexColor("#ecebff" if i==1 else "#ffffff")); c.roundRect(48,y-74,width-96,85,15,fill=1,stroke=0)
        c.setFillColor(colors.HexColor("#8174e8")); c.setFont("YunluBold", 10); c.drawString(66,y-20,num)
        c.setFillColor(colors.HexColor("#42454c")); c.setFont("YunluBold", 16); c.drawString(110,y-18,title)
        draw_wrapped(c, copy, 110, y-41, width-190, 10, 15)
    c.setFillColor(colors.HexColor("#5e58aa")); c.setFont("YunluBold", 16); c.drawString(48, 112, "核心价值：减少试错，把时间留给真正重要的判断。")
    c.showPage()

    # Workflow
    pdf_page(c, 3, "The Workflow", "一款衣服，沿着六个清晰节点向前。", "每一步都能暂停、修改、回退，再继续")
    steps = [("01", "市场洞察", "热卖品类、色彩、面料、版型与竞品动态"), ("02", "AI 设计", "面料图 + 版型 + 自然语言，生成多个方案"), ("03", "数字样衣评审", "真人试穿、3D、2D 纸样和尺寸同步评审"), ("04", "人工打样", "锁定版本，导出纸样，等待样衣回传"), ("05", "营销内容", "样衣图生成文案、海报与视频任务"), ("06", "数据回流", "销售结果写回下一轮市场判断")]
    for i,(num,title,copy) in enumerate(steps):
        y = height-250-i*78
        c.setFillColor(colors.HexColor("#8174e8" if i==2 else "#dedcff")); c.circle(68,y,15,fill=1,stroke=0)
        c.setFillColor(colors.white if i==2 else colors.HexColor("#7067c9")); c.setFont("YunluBold", 8); c.drawCentredString(68,y-3,num)
        c.setFillColor(colors.HexColor("#44474e")); c.setFont("YunluBold", 13); c.drawString(102,y+3,title)
        c.setFillColor(colors.HexColor("#858890")); c.setFont("Yunlu", 9); c.drawString(102,y-15,copy)
        if i < 5:
            c.setStrokeColor(colors.HexColor("#d9d8e8")); c.setLineWidth(1); c.line(68,y-16,68,y-61)
    c.showPage()

    # AI design
    pdf_page(c, 4, "Agent 02 / Generative Design", "AI 设计不是一次生成，而是一轮轮变得更接近。", "每一轮都保留版本、参数与成本，老板始终掌握决定权")
    design = Image.open(ASSETS / "editorial-01.jpg").convert("RGB")
    c.drawImage(ImageReader(design), 48, 255, width=245, height=245*design.height/design.width, mask="auto")
    c.setFillColor(colors.HexColor("#eeedff")); c.roundRect(315, 440, width-363, 120, 14, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#5d55a8")); c.setFont("YunluBold", 14); c.drawString(333, 525, "输入")
    draw_wrapped(c, "面料图 · T 恤 / 卫衣 / 裤子 / 裙子 · 自然语言诉求", 333, 500, width-405, 10, 16)
    c.setFillColor(colors.HexColor("#ffffff")); c.roundRect(315, 285, width-363, 120, 14, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#5d5f67")); c.setFont("YunluBold", 14); c.drawString(333, 370, "输出")
    draw_wrapped(c, "3-5 个设计方向 · 可生产性 · 预计成本 · 多轮修改 · 版本回退", 333, 345, width-405, 10, 16)
    c.setFillColor(colors.HexColor("#6561ab")); c.setFont("YunluBold", 16); c.drawString(48, 176, "客户演示时可以这样说")
    draw_wrapped(c, "先把面料和想法告诉云麓，再通过颜色、结构、功能几个方向快速比较。它不是替老板做决定，而是让每一个决定都更有依据。", 48, 148, width-96, 11, 18)
    c.showPage()

    # Review
    pdf_page(c, 5, "Agent 03-04 / Digital Sample Review", "在打样之前，把风险暴露在屏幕上。", "一个界面，完成试穿反馈、3D 调整、纸样尺寸和送样确认")
    review = Image.open(ASSETS / "digital-sample-review.png").convert("RGB")
    review.thumbnail((width-84, 310), Image.Resampling.LANCZOS)
    c.drawImage(ImageReader(review), 42, 355, width=width-84, height=review.height*(width-84)/review.width, mask="auto")
    c.setFillColor(colors.HexColor("#ffffff")); c.roundRect(48, 142, width-96, 155, 15, fill=1, stroke=0)
    for i,(title,copy) in enumerate([("对真人", "袖长、胸围、活动量"),("对数字样衣", "领型、口袋、结构线"),("对纸样", "尺寸、缝份、打印校准")]):
        x=68+i*170
        c.setFillColor(colors.HexColor(["#75b981","#8174e8","#e3a35f"][i])); c.circle(x,265,6,fill=1,stroke=0)
        c.setFillColor(colors.HexColor("#50535b")); c.setFont("YunluBold", 10); c.drawString(x+14,261,title)
        draw_wrapped(c, copy, x, 241, 135, 8, 12)
    c.setFillColor(colors.HexColor("#5e58aa")); c.setFont("YunluBold", 12); c.drawString(68, 166, "确认 V04 → 锁定纸样 → 创建人工打样任务")
    c.showPage()

    # Pilot
    pdf_page(c, 6, "Pilot / Next Step", "从一个真实款式开始，验证完整闭环。", "建议用 1-2 周完成一款试点，留下可复用的流程与数据")
    c.setFillColor(colors.HexColor("#282a31")); c.roundRect(48, 430, width-96, 140, 18, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#c8c4ff")); c.setFont("YunluBold", 19); c.drawString(70, 525, "首个试点建议")
    draw_wrapped(c, "选择一个秋冬轻户外款式：上传面料图，输入市场关键词，完成设计、数字样衣评审、纸样导出和第一次送样。", 70, 493, width-140, 12, 20, "#ffffff")
    items = [("客户需要提供", "1 张面料图 · 1 个目标品类 · 1 组尺码要求"), ("现场可以看到", "4 个设计方向 · 1 个评审版本 · 1 份纸样 PDF"), ("试点之后得到", "真实试穿反馈 · 成本记录 · 下一轮设计依据")]
    for i,(title,copy) in enumerate(items):
        y=350-i*75
        c.setFillColor(colors.HexColor("#8174e8")); c.circle(61,y+5,6,fill=1,stroke=0)
        c.setFillColor(colors.HexColor("#55585f")); c.setFont("YunluBold", 12); c.drawString(82,y,title)
        c.setFillColor(colors.HexColor("#858890")); c.setFont("Yunlu", 10); c.drawString(82,y-20,copy)
    c.setFillColor(colors.HexColor("#8174e8")); c.setFont("YunluBold", 14); c.drawString(48, 100, "在线体验")
    c.setFillColor(colors.HexColor("#5e58aa")); c.setFont("Yunlu", 11); c.drawString(48, 78, "https://cavannnnn.github.io/yunlu-studio-demo/")
    c.linkURL("https://cavannnnn.github.io/yunlu-studio-demo/", (48, 70, 390, 90), relative=0)
    c.save()


poster_hero()
poster_design()
poster_review()
make_pdf()
print(PDF_OUT)
