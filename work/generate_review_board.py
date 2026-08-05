from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math
import random

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
OUT = ASSETS / "digital-sample-review.png"
W, H = 1800, 1120


def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/STHeiti Medium.ttc" if bold else "/System/Library/Fonts/STHeiti Light.ttc",
        "/System/Library/Fonts/Hiragino Sans GB.ttc",
        "/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size=size, index=0)
            except OSError:
                pass
    return ImageFont.load_default()


def rounded_mask(size, radius):
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    return mask


def cover(img, size, focus_y=0.5):
    ratio = max(size[0] / img.width, size[1] / img.height)
    resized = img.resize((int(img.width * ratio), int(img.height * ratio)), Image.Resampling.LANCZOS)
    x = max(0, (resized.width - size[0]) // 2)
    y = max(0, min(resized.height - size[1], int((resized.height - size[1]) * focus_y)))
    return resized.crop((x, y, x + size[0], y + size[1]))


canvas = Image.new("RGB", (W, H), "#e8e9eb")
draw = ImageDraw.Draw(canvas)

# Header
draw.text((64, 43), "YUNLU / DIGITAL SAMPLE REVIEW", font=font(18, True), fill="#777b83")
draw.text((64, 77), "轻户外针织外套 · 数字样衣评审", font=font(42, True), fill="#202329")
draw.text((64, 132), "试穿样本、数字样衣、纸样与生产参数在同一视图中同步确认", font=font(20), fill="#8d9097")
draw.rounded_rectangle((1510, 60, 1735, 112), radius=26, fill="#25272d")
draw.ellipse((1531, 77, 1547, 93), fill="#75bd82")
draw.text((1560, 72), "实时联动 · V04", font=font(16, True), fill="white")

# Panel geometry
left = (52, 190, 570, 1048)
center = (594, 190, 1268, 1048)
right = (1292, 190, 1748, 1048)
for rect in (left, center, right):
    draw.rounded_rectangle(rect, radius=28, fill="#f8f8f8")

# Wear sample photo
photo = Image.open(ASSETS / "editorial-02.jpg").convert("RGB")
photo = cover(photo, (left[2]-left[0], left[3]-left[1]), 0.38)
photo = photo.filter(ImageFilter.Color3DLUT.generate(17, lambda r,g,b: (r*.94, g*.96, min(1,b*1.06))))
canvas.paste(photo, (left[0], left[1]), rounded_mask(photo.size, 28))
overlay = Image.new("RGBA", photo.size, (0,0,0,0))
od = ImageDraw.Draw(overlay)
for y in range(overlay.height):
    a = int(max(0, (y-overlay.height*.58)/(overlay.height*.42))*145)
    od.line((0,y,overlay.width,y), fill=(10,16,28,a))
canvas.paste(overlay, (left[0], left[1]), overlay)
draw.rounded_rectangle((76, 216, 221, 252), radius=18, fill=(28,31,39))
draw.ellipse((91, 229, 101, 239), fill="#75bd82")
draw.text((111, 224), "真人试穿样本", font=font(14, True), fill="white")
draw.text((80, 920), "LOOK 01 / 样衣实拍", font=font(14, True), fill="#d6d9df")
draw.text((80, 951), "110 码 · 身高 108 cm", font=font(22, True), fill="white")
draw.text((80, 990), "肩部活动量充足  /  袖长建议 -1.5 cm", font=font(15), fill="#d7d9dd")

# Central digital garment background
cx0, cy0, cx1, cy1 = center
for y in range(cy0, cy1):
    t = (y-cy0)/(cy1-cy0)
    c = int(247 - t*25)
    draw.line((cx0,y,cx1,y), fill=(c,c+1,c+3))
draw.rounded_rectangle((620, 216, 792, 252), radius=18, fill="#ffffff")
draw.ellipse((636, 229, 646, 239), fill="#8173e7")
draw.text((656, 224), "3D 数字样衣", font=font(14, True), fill="#565a62")

# Garment shadow
shadow = Image.new("RGBA", (650, 650), (0,0,0,0))
sd = ImageDraw.Draw(shadow)
sd.ellipse((95, 540, 555, 625), fill=(20,24,32,72))
shadow = shadow.filter(ImageFilter.GaussianBlur(25))
canvas.paste(shadow, (606, 337), shadow)

# Procedural navy cardigan render
garment = Image.new("RGBA", (650, 700), (0,0,0,0))
gd = ImageDraw.Draw(garment)
body_poly = [(210,95),(279,76),(325,98),(371,76),(440,95),(535,185),(484,287),(451,253),(475,625),(175,625),(199,253),(166,287),(115,185)]
gd.polygon(body_poly, fill="#142f58")
for x in range(130, 520, 3):
    light = int(26 + 32*math.exp(-((x-310)/125)**2))
    gd.line((x,115,x,610), fill=(15+light//3,34+light//2,65+light), width=3)
gd.polygon([(115,185),(65,333),(136,362),(199,253),(166,287)], fill="#173762")
gd.polygon([(535,185),(585,333),(514,362),(451,253),(484,287)], fill="#173762")
gd.line((325,100,325,614), fill="#74b5ed", width=8)
gd.line((337,100,337,614), fill="#d8eefc", width=3)
gd.line((208,96,281,76,325,100,371,76,441,96), fill="#8ac5f2", width=12, joint="curve")
gd.line((214,105,281,88,325,111,371,88,434,105), fill="#e1f2fc", width=4, joint="curve")
for y in range(166, 575, 62):
    gd.ellipse((316,y,344,y+23), fill="#0c1c34", outline="#8ac5f2", width=2)
gd.rounded_rectangle((186,600,464,646), radius=12, fill="#102949")
gd.line((187,608,463,608), fill="#79b7e7", width=4)
gd.rounded_rectangle((100,338,157,616), radius=16, fill="#142f58")
gd.rounded_rectangle((493,338,550,616), radius=16, fill="#142f58")
for x in (106,114,122,130,138,146,501,509,517,525,533,541):
    gd.line((x,355,x,604), fill="#224a78", width=2)
gd.rounded_rectangle((220,355,298,410), radius=8, outline="#6da6d2", width=2)
gd.rounded_rectangle((352,355,430,410), radius=8, outline="#6da6d2", width=2)
gd.arc((275,194,375,286), 8, 172, fill="#83bce8", width=3)
gd.text((273,224), "YUNLU", font=font(15, True), fill="#b9ddf5")
noise = Image.effect_noise((650,700), 26).convert("L")
noise_alpha = noise.point(lambda p: 18 if p > 135 else 0)
garment = Image.alpha_composite(garment, Image.merge("RGBA", (noise,noise,noise,noise_alpha)))
garment = garment.filter(ImageFilter.GaussianBlur(.35))
canvas.paste(garment, (606, 275), garment)

# Central annotations
annotations = [((674,380),(765,430),"V 领深度\n-0.8 cm"),((1100,470),(1030,520),"袖窿活动量\n+2.4 cm"),((713,780),(800,722),"罗纹下摆\n弹性 1:0.82")]
for anchor, target, label in annotations:
    draw.line((*anchor,*target), fill="#7668df", width=2)
    draw.ellipse((anchor[0]-4,anchor[1]-4,anchor[0]+4,anchor[1]+4), fill="#7668df")
    box=(target[0]-4,target[1]-4,target[0]+116,target[1]+48)
    draw.rounded_rectangle(box, radius=10, fill="#ffffff", outline="#dedbea", width=1)
    draw.multiline_text((target[0]+8,target[1]+4),label,font=font(13,True),fill="#676274",spacing=4)
draw.text((632, 982), "旋转 24°", font=font(14, True), fill="#656971")
draw.rounded_rectangle((730, 972, 1104, 1008), radius=18, fill="#e2e2e5")
draw.rounded_rectangle((731, 973, 908, 1007), radius=17, fill="#8173e7")
draw.text((1132, 982), "材质真实度 92%", font=font(14, True), fill="#656971")

# Right technical board
rx0, ry0, rx1, ry1 = right
draw.rounded_rectangle((1318, 216, 1456, 252), radius=18, fill="#ecebff")
draw.text((1335, 224), "2D 纸样同步", font=font(14, True), fill="#6d61d2")
paper=(1318,278,1722,690)
draw.rounded_rectangle(paper, radius=18, fill="#fffdf8", outline="#e7e1d7", width=2)
draw.text((1340,298), "YL-24AW-021 / SIZE 110", font=font(12, True), fill="#8c857b")
front=[(1365,375),(1410,340),(1455,356),(1482,340),(1525,374),(1548,438),(1511,472),(1497,652),(1389,652),(1375,472),(1342,438)]
back=[(1570,377),(1605,344),(1641,358),(1676,344),(1710,378),(1720,442),(1688,473),(1684,648),(1584,648),(1580,473),(1550,442)]
draw.polygon(front, fill="#f2ecdf", outline="#a99f90")
draw.polygon(back, fill="#eee6d7", outline="#a99f90")
for x in (1444,1635):
    draw.line((x,370,x,630), fill="#b4aa9c", width=1)
    draw.polygon([(x,366),(x-4,374),(x+4,374)], fill="#b4aa9c")
draw.text((1414,488),"前片",font=font(17,True),fill="#908778")
draw.text((1608,488),"后片",font=font(17,True),fill="#908778")
for y in (420,538):
    draw.line((1338,y,1710,y), fill="#c9c0b4", width=1)
draw.line((1345,666,1510,666), fill="#887e70", width=3)
draw.text((1345,676), "100 mm 打印校准", font=font(11), fill="#938a7f")

# Measurements and material
draw.text((1320, 726), "关键尺寸 / MEASUREMENTS", font=font(13, True), fill="#888b92")
rows=[("衣长","45.0 cm","0.0"),("胸围","72.4 cm","+2.4"),("袖长","39.5 cm","-1.5"),("下摆罗纹","58.2 cm","0.0")]
for i,(name,value,delta) in enumerate(rows):
    y=760+i*48
    draw.line((1320,y+38,1720,y+38), fill="#e6e6e8", width=1)
    draw.text((1320,y),name,font=font(14),fill="#777b82")
    draw.text((1482,y),value,font=font(14,True),fill="#454950")
    color="#6ba578" if delta=="0.0" else "#8173e7"
    draw.text((1655,y),delta,font=font(14,True),fill=color)
draw.text((1320, 967), "面料", font=font(13, True), fill="#8b8e95")
swatches=[("#142f58","主布"),("#7bb9e7","饰边"),("#e7f2f9","内衬")]
for i,(color,label) in enumerate(swatches):
    x=1320+i*122
    draw.ellipse((x,998,x+22,1020), fill=color, outline="#d9dade")
    draw.text((x+31,998),label,font=font(12),fill="#777a82")

canvas.save(OUT, quality=95)
print(OUT)
