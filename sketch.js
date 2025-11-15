let mover = [];
let liquid;
let c;

// 選單設定
let menu = {
    x: -150, // 初始位置在畫面外
    targetX: -150, // 目標位置
    y: 0,
    w: 140,
    items: [
        { text: "單元一作品.", link: "https://zhang20432-beep.github.io/20251014_2/" },
        { text: "單元一筆記.", link: "https://hackmd.io/@P6gPl0KeQ7mpAQk7Nr4c6Q/SkU1MKb3ee" },
        { text: "測驗卷.", link: "https://zhang20432-beep.github.io/20251028_3/" },
        { text: "測驗卷筆記.", link: "https://hackmd.io/@P6gPl0KeQ7mpAQk7Nr4c6Q/Hkw7_yD1-l" },
        { text: "作品筆記.", link: "https://hackmd.io/@P6gPl0KeQ7mpAQk7Nr4c6Q/H1LU2P8xWg" },
        { text: "淡江大學", link: "https://www.tku.edu.tw" },
        { text: "教育科技學系", link: "https://www.et.tku.edu.tw/main.aspx" },
        { text: "關閉視窗.", link: null }
    ],
    paddingTop: 28,
    lineHeight: 32,
    selected: -1,
    activeSubMenu: -1 // 追蹤哪個主選單項目正在顯示子選單
};

// 觸發距離（滑鼠距離左邊小於等於此值時顯示選單）
menu.trigger = 100;

let tx;

// 新增 iframe 相關變數
let iframeContainer = null;
let iframeEl = null;
let iframeCloseBtn = null;

// 新增：用來儲存星星資訊的陣列
let stars = [];

// 新增：右上角圓形圖片相關變數
let profileImage;
let nameOpacity = 0; // 用於名字的淡入淡出效果
let imageScale = 1; // 新增：用於圖片縮放效果
let glowBlur = 0; // 新增：用於光暈效果

// 新增：滑鼠拖尾特效
let mouseTrail = [];
const TRAIL_LENGTH = 25; // 拖尾長度

function preload() {
    // 載入與 sketch.js 位於同一資料夾的圖片
    profileImage = loadImage("E6AC3FB0-E942-43AD-945B-9CDB6F0DD893.png");
}

function setup() {
    // 改為全螢幕畫布
    createCanvas(windowWidth, windowHeight);
    menu.h = height; // 選單高度為螢幕高度

    // movers 初始位置改為相對於畫面中心
    mover = [];
    for (let i = 0; i < 30; i++) {
        mover[i] = new Mover(random(1, 5), random(width / 2 - 70, width / 2 + 70), random(160, 170), 45, 70, 6);
    }

    // water 位置與大小改為相對於畫面中心
    liquid = new Water(width / 2 - 80, height / 2 - 80, 160, 315, 0.5);

    // tx 圖層改為全螢幕
    tx = createGraphics(width, height);
    tx.angleMode(DEGREES);
    tx.noStroke();
    
    // 建立星星並儲存它們的屬性，範圍擴展到整個畫布
    stars = []; // 清空陣列以備視窗大小改變時重建
    // 調整星星數量以適應整個畫布大小
    let numStars = (width * height) / 500; 
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: random(width),
            y: random(height),
            speedY: random(0.1, 0.5), // 每個星星有不同的飄動速度
            size: random(1, 4)
        });
    }

    // 新增：建立圓形遮罩並套用
    let imgSize = 135; // 圖片顯示大小
    profileImage.resize(imgSize, imgSize); // 調整圖片大小
    let maskImage = createGraphics(imgSize, imgSize);
    maskImage.fill(255); // 遮罩的形狀用白色填滿
    maskImage.noStroke();
    maskImage.circle(imgSize / 2, imgSize / 2, imgSize);
    profileImage.mask(maskImage); // 將圓形遮罩套用到圖片上
}

function draw() {
    background("#212331");

    let isMouseOverMenu = mouseX > menu.x && mouseX < menu.x + menu.w && mouseY > menu.y && mouseY < menu.y + menu.h;
    let isMouseOverSubMenu = false;

    if (menu.activeSubMenu !== -1) {
        let mainItem = menu.items[menu.activeSubMenu];
        if (mainItem && mainItem.subItems) {
            let ty = menu.y + menu.paddingTop + menu.activeSubMenu * menu.lineHeight;
            let subMenuX = menu.x + menu.w + 5;
            let subMenuY = ty - 8;
            let subMenuH = mainItem.subItems.length * menu.lineHeight + 16;
            isMouseOverSubMenu = mouseX > subMenuX && mouseX < subMenuX + menu.w && mouseY > subMenuY && mouseY < subMenuY + subMenuH;
        }
    }

    // 根據滑鼠位置決定選單的目標X座標
    if (mouseX <= menu.trigger || isMouseOverMenu || isMouseOverSubMenu) {
        menu.targetX = 10;
    } else {
        menu.targetX = -150;
    }
    // 平滑移動選單
    menu.x += (menu.targetX - menu.x) * 0.08;

    let wind = createVector(0, 0);
    if (mouseIsPressed) {
        wind = createVector(0, -1);
    }
    bottle();
    for (let i = 0; i < mover.length; i++) {
        // 新增：滑鼠互動效果
        let distance = dist(mouseX, mouseY, mover[i].pos.x, mover[i].pos.y);
        // 如果滑鼠距離星星小於 60 像素
        if (distance < 60) {
            // 建立一個從滑鼠指向星星的向量作為排斥力
            let repelForce = p5.Vector.sub(mover[i].pos, createVector(mouseX, mouseY));
            repelForce.setMag(1.5); // 設定固定的排斥力道
            mover[i].applyForce(repelForce);
        }

        if (liquid.contains(mover[i])) {
            let dragForce = liquid.calculateDrag(mover[i]);
            mover[i].applyForce(dragForce);
        }

        let m = mover[i].mass;
        let gravity = createVector(0, 0.1 * m);
        mover[i].applyForce(wind);
        mover[i].applyForce(gravity);
        mover[i].update();
        mover[i].show();
        mover[i].checkEdges();
        liquid.show();
    }

    // 更新並繪製會飄動的星星
    tx.clear(); // 清除上一幀的星星 (這行必須保留，否則星星會拖影)

    for (let star of stars) {
        star.y += star.speedY; // 向下移動
        // 如果星星飄出畫布底部，讓它回到畫布頂部重新開始
        if (star.y > height) {
            star.y = 0;
            star.x = random(width); // 重新給予隨機的 x 位置
        }
        tx.fill(255, 240); // 讓星星亮一點
        tx.ellipse(star.x, star.y, star.size, star.size);
    }

    image(tx, 0, 0);

    // 在畫布中間加上文字
    push();
    textAlign(CENTER, CENTER);
    textSize(80);
    textFont('Rampart One'); // 套用 Rampart One 字體
    fill(255); // 白色
    text("淡江大學", width / 2, height / 2);
    pop();

    // 繪製選單
    drawMenu();

    // 新增：在右上角繪製圓形圖片
    let imgSize = 120;
    let margin = 20;
    let imgOriginalX = width - imgSize - margin;
    let imgOriginalY = margin;

    // 計算圖片中心點
    let imgCenterX = imgOriginalX + imgSize / 2;
    let imgCenterY = imgOriginalY + imgSize / 2;

    // 檢查滑鼠是否懸停在圖片上
    let isHovering = dist(mouseX, mouseY, imgCenterX, imgCenterY) < imgSize / 2;
    let targetScale = isHovering ? 1.2 : 1;
    let targetGlow = isHovering ? 20 : 0;

    // 平滑地改變縮放比例
    imageScale += (targetScale - imageScale) * 0.1;
    // 平滑地改變光暈
    glowBlur += (targetGlow - glowBlur) * 0.1;

    // 計算縮放後的尺寸與位置，使其從中心縮放
    let scaledSize = imgSize * imageScale;
    let imgX = imgCenterX - scaledSize / 2;
    let imgY = imgCenterY - scaledSize / 2;

    push();
    if (glowBlur > 1) {
        drawingContext.shadowBlur = glowBlur;
        drawingContext.shadowColor = 'rgba(255, 255, 255, 0.7)';
    }
    image(profileImage, imgX, imgY, scaledSize, scaledSize);
    pop();

    // 新增：當滑鼠移到圖片上時顯示名字
    let targetOpacity = 0;
    if (isHovering) {
        targetOpacity = 255; // 目標透明度設為完全可見
    }

    // 平滑地改變透明度
    nameOpacity += (targetOpacity - nameOpacity) * 0.1;

    // 只有當透明度大於 1 時才繪製文字
    if (nameOpacity > 1) {
        push();
        textSize(24);
        textFont('Rampart One'); // 套用 Noto Sans TC 字體
        fill(255, nameOpacity); // 使用動態透明度
        textAlign(RIGHT, CENTER); // 文字靠右對齊，垂直置中
        text("114730514 張芷瑄", imgOriginalX - 25, imgCenterY);
        pop();
    }

    // 新增：更新並繪製滑鼠拖尾特效
    mouseTrail.push(createVector(mouseX, mouseY));

    // 保持拖尾陣列的長度
    if (mouseTrail.length > TRAIL_LENGTH) {
        mouseTrail.splice(0, 1);
    }

    // 繪製拖尾
    for (let i = 0; i < mouseTrail.length; i++) {
        let pos = mouseTrail[i];
        let opacity = map(i, 0, mouseTrail.length, 0, 150); // 讓拖尾從透明到半透明
        let size = map(i, 0, mouseTrail.length, 2, 12); // 讓拖尾從大到小
        noStroke();
        fill(244, 241, 222, opacity); // 使用與星星類似的顏色
        ellipse(pos.x, pos.y, size, size);
    }
}

function bottle() {
    push();
    drawingContext.shadowOffsetX = 0;
    drawingContext.shadowOffsetY = 0;
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = "#f4f1de";
    fill(220);
    noStroke();
    push();

    rectMode(CENTER);
    // 瓶子置中（隨視窗寬度自動置中）
    let bx = width / 2;
    rect(bx, 80, 40, 30, 20);
    rect(bx, 100, 130, 20, 10);
    rect(bx, 130, 100, 50, 10);
    rect(bx, height / 2 + 50, 180, 400, 50);
    rect(bx, height / 2 + 150, 180, 200, 20);
    pop();
    pop();
}

class Mover {
    constructor(m, x, y, radius1, radius2, npoints) {
        this.radius1 = radius1;
        this.radius2 = radius2;
        this.npoints = npoints;
        this.angle = TWO_PI / this.npoints;
        this.halfAngle = this.angle / 2.0;

        this.mass = m;
        this.pos = createVector(x, y);
        this.vel = createVector(0, 0);
        this.acc = createVector(0.0);
        this.d = this.mass * 8;
        this.yama = this.radius1 * this.mass / 15;
        this.tani = this.radius2 * this.mass / 15;
    }
    applyForce(force) {
        let f = p5.Vector.div(force, this.mass);
        this.acc.add(f);
    }
    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }
    show() {
        stroke(255);
        c = color("#f4f1de");
        fill(c);
        push();
        drawingContext.shadowOffsetX = 0;
        drawingContext.shadowOffsetY = 0;
        drawingContext.shadowBlur = 30;
        drawingContext.shadowColor = "#f4f1de";
        beginShape();
        for (let a = 0; a < TWO_PI; a += this.angle) {
            let sx = this.pos.x + cos(a) * this.yama;
            let sy = this.pos.y + sin(a) * this.yama;
            vertex(sx, sy);
            sx = this.pos.x + cos(a + this.halfAngle) * this.tani;
            sy = this.pos.y + sin(a + this.halfAngle) * this.tani;
            vertex(sx, sy);
        }
        endShape(CLOSE);
        pop();
    }

    checkEdges() {
        // 使用相對於畫布大小的邊界，避免固定數值在全螢幕下錯位
        let bottom = height / 2 + 250;
        let leftBound = width / 2 - 90;
        let rightBound = width / 2 + 90;
        let topBound = 150;

        if (this.pos.y > bottom - this.d) {
            this.vel.y *= -1;
            this.pos.y = bottom - this.d;

        } else if (this.pos.x > rightBound - this.d / 2) {
            this.pos.x = rightBound - this.d / 2;
            this.vel.x *= -1;

        } else if (this.pos.x < leftBound + this.d / 2) {
            this.vel.x *= -1;
            this.pos.x = leftBound + this.d / 2;

        } else if (this.pos.y < topBound) {
            this.vel.y *= -1;
            this.pos.y = topBound;
        }
    }
}

class Water {
    constructor(x, y, w, h, c) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.c = c;
    }

    contains(mover) {
        let l = mover.pos;
        return l.x > this.x && l.x < this.x + this.w &&
            l.y > this.y && l.y < this.y + this.h;
    }
    calculateDrag(mover) {
        let speed = mover.vel.mag();
        let dragMagnitude = this.c * speed * speed;

        let dragForce = mover.vel.copy();
        dragForce.mult(-1);
        dragForce.normalize();
        dragForce.mult(dragMagnitude);
        return dragForce;
    }

    show() {
        noStroke();
        let cw = color("#91ADC2");
        cw.setAlpha(10);
        fill(cw); //water color
        rect(this.x, this.y, this.w, this.h);
    }
}

// 畫選單並處理滑鼠互動顯示
function drawMenu() {
    push();
    menu.activeSubMenu = -1; // 每幀重置

    noStroke();
    // 半透明白色背景
    fill(255, 200);
    rect(menu.x, menu.y, menu.w, menu.h, 8);

    // 檢查滑鼠是否在選單範圍內並找出懸停項目
    let hoverIndex = -1;
    if (mouseX > menu.x && mouseX < menu.x + menu.w &&
        mouseY > menu.y && mouseY < menu.y + menu.h) {
        let relativeY = mouseY - (menu.y + menu.paddingTop);
        if (relativeY > 0) {
            hoverIndex = floor(relativeY / menu.lineHeight);
        } else {
            hoverIndex = -1;
        }
        if (hoverIndex < 0 || hoverIndex >= menu.items.length) hoverIndex = -1;
    }
    // 擴展 hover 偵測範圍，如果子選單是打開的，也要把滑鼠在子選單上的情況考慮進去
    if (menu.activeSubMenu !== -1) {
        let mainItem = menu.items[menu.activeSubMenu];
        if (mainItem && mainItem.subItems) {
            let ty = menu.y + menu.paddingTop + menu.activeSubMenu * menu.lineHeight;
            let subMenuX = menu.x + menu.w + 5;
            let subMenuY = ty - 8;
            let subMenuH = mainItem.subItems.length * menu.lineHeight + 16;
            if (mouseX > subMenuX && mouseX < subMenuX + menu.w &&
                mouseY > subMenuY && mouseY < subMenuY + subMenuH) {
                hoverIndex = menu.activeSubMenu; // 保持主選單的 hover 狀態
            }
        }
    }

    // 畫懸停高亮
    if (hoverIndex >= 0) {
        fill(0, 10);
        rect(menu.x + 8, menu.y + menu.paddingTop + hoverIndex * menu.lineHeight - 6, menu.w - 16, menu.lineHeight - 4, 6);
    }

    // 標題
    fill(40);
    textSize(14);
    textAlign(LEFT, TOP);
    text("選單", menu.x + 12, menu.y + 6);

    // 畫選項文字（字小，避免重疊）
    textSize(14);
    fill(30);
    for (let i = 0; i < menu.items.length; i++) { // 繪製主選單
        let ty = menu.y + menu.paddingTop + i * menu.lineHeight;
        text(menu.items[i].text, menu.x + 14, ty);

        // 如果滑鼠懸停在此項目且它有子選單，則顯示子選單
        if (i === hoverIndex && menu.items[i].subItems) {
            menu.activeSubMenu = i;
            let subMenuX = menu.x + menu.w + 5;
            let subMenuY = ty - 8;
            let subItems = menu.items[i].subItems;
            let subMenuH = subItems.length * menu.lineHeight + 16;

            // 畫子選單背景
            fill(255, 220);
            rect(subMenuX, subMenuY, menu.w, subMenuH, 8);

            // 檢查滑鼠是否在子選單上
            let subHoverIndex = -1;
            if (mouseX > subMenuX && mouseX < subMenuX + menu.w &&
                mouseY > subMenuY && mouseY < subMenuY + subMenuH) {
                subHoverIndex = floor((mouseY - subMenuY - 8) / menu.lineHeight);
                if (subHoverIndex < 0 || subHoverIndex >= subItems.length) {
                    subHoverIndex = -1;
                }
            }

            // 畫子選單高亮
            if (subHoverIndex !== -1) {
                fill(0, 10);
                rect(subMenuX + 8, subMenuY + 8 + subHoverIndex * menu.lineHeight, menu.w - 16, menu.lineHeight - 4, 6);
            }

            // 畫子選單文字
            fill(30);
            for (let j = 0; j < subItems.length; j++) {
                text(subItems[j].text, subMenuX + 14, subMenuY + 8 + j * menu.lineHeight + 4);
            }
        }
    }

    pop();
}

// 點擊選單處理（會在 console.log 顯示選到的項目）
function mousePressed() {
    if (menu.x > -menu.w && // 只有當選單可見時才處理
        mouseX > menu.x && mouseX < menu.x + menu.w &&
        mouseY > menu.y && mouseY < menu.y + menu.h) {
        let idx = floor((mouseY - (menu.y + menu.paddingTop)) / menu.lineHeight);
        if (idx >= 0 && idx < menu.items.length) {
            const item = menu.items[idx];
            // 如果點擊的是「淡江大學」，只打開連結，不關閉選單
            if (item.text === "淡江大學" && item.link) {
                openIframe(item.link);
            } else if (!item.subItems) { // 對於沒有子選單的項目
                console.log("選擇:", item.text);
                menu.selected = idx;
                if (item.link) {
                    openIframe(item.link);
                } else {
                    closeIframe();
                }
            }
        }
        return; // 若選單被點擊，停止其他點擊處理
    }

    // 檢查是否點擊了子選單
    if (menu.activeSubMenu !== -1) {
        let mainItem = menu.items[menu.activeSubMenu];
        let subItems = mainItem.subItems;
        let subMenuX = menu.x + menu.w + 5;
        let subMenuY = menu.y + menu.paddingTop + menu.activeSubMenu * menu.lineHeight - 8;
        let subMenuH = subItems.length * menu.lineHeight + 16;

        if (mouseX > subMenuX && mouseX < subMenuX + menu.w &&
            mouseY > subMenuY && mouseY < subMenuY + subMenuH) {
            let subIdx = floor((mouseY - subMenuY - 8) / menu.lineHeight);
            if (subIdx >= 0 && subIdx < subItems.length) {
                openIframe(subItems[subIdx].link);
            }
        }
    }

    // ...existing code... （若有其他 mousePressed 行為，保留）
}

// 在視窗大小改變時調整畫布與相關資源
function windowResized() {
    // 調整畫布為全螢幕
    resizeCanvas(windowWidth, windowHeight);
    menu.h = height; // 選單高度也跟著變

    // 重新建立 tx 圖層以符合新尺寸
    tx = createGraphics(windowWidth, windowHeight);
    tx.angleMode(DEGREES);
    tx.noStroke();

    // 重新建立星星以適應新視窗大小
    stars = [];
    let bottleX = width / 2 - 90;
    let bottleY = 150;
    let bottleW = 180;
    let bottleH = height / 2 + 250 - 150;
    for (let i = 0; i < (bottleW * bottleH) / 20; i++) {
        stars.push({
            x: random(bottleX, bottleX + bottleW),
            y: random(bottleY, bottleY + bottleH),
            speedY: random(0.1, 0.5),
            size: random(1, 4)
        });
    }

    // 確保 water 回到畫面中心
    liquid.x = width / 2 - 80;
    liquid.y = height / 2 - 80;
    liquid.w = 160;
    liquid.h = 315; // 高度保持不變
}

// 新增：建立並顯示 iframe overlay（寬高為視窗的 80%）
function openIframe(url) {
    closeIframe(); // 先移除舊的

    // container 放 iframe 與關閉按鈕
    iframeContainer = createDiv();
    iframeContainer.style("position", "fixed");
    iframeContainer.style("left", "50%");
    iframeContainer.style("top", "50%");
    iframeContainer.style("transform", "translate(-50%, -50%)");
    iframeContainer.style("width", "80vw");
    iframeContainer.style("height", "80vh");
    iframeContainer.style("z-index", "9999");
    iframeContainer.style("box-shadow", "0 8px 30px rgba(0,0,0,0.45)");
    iframeContainer.style("background", "#ffffff");

    // iframe 元件
    iframeEl = createElement("iframe");
    iframeEl.attribute("src", url);
    iframeEl.attribute("frameborder", "0");
    iframeEl.style("width", "100%");
    iframeEl.style("height", "100%");
    iframeEl.style("border", "none");
    iframeEl.parent(iframeContainer);

    // 關閉按鈕
    iframeCloseBtn = createButton("✕");
    iframeCloseBtn.parent(iframeContainer);
    iframeCloseBtn.style("position", "absolute");
    iframeCloseBtn.style("top", "8px");
    iframeCloseBtn.style("right", "8px");
    iframeCloseBtn.style("padding", "6px 10px");
    iframeCloseBtn.style("font-size", "16px");
    iframeCloseBtn.style("background", "rgba(0,0,0,0.6)");
    iframeCloseBtn.style("color", "#fff");
    iframeCloseBtn.style("border", "none");
    iframeCloseBtn.style("border-radius", "4px");
    iframeCloseBtn.style("cursor", "pointer");
    iframeCloseBtn.mousePressed(closeIframe);

    // 按 Esc 也可關閉
    function escHandler(e) {
        if (e.key === "Escape") closeIframe();
    }
    // 綁定到 window（記得解除綁定）
    window.addEventListener("keydown", escHandler, { once: false });
    // 把 handler 暫存在 container 上，方便關閉時移除
    iframeContainer.elt._escHandler = escHandler;
}

// 新增：關閉並移除 iframe overlay
function closeIframe() {
    if (iframeContainer) {
        // 移除 Esc 事件
        if (iframeContainer.elt && iframeContainer.elt._escHandler) {
            window.removeEventListener("keydown", iframeContainer.elt._escHandler);
        }
        iframeContainer.remove();
        iframeContainer = null;
        iframeEl = null;
        iframeCloseBtn = null;
        // 清掉選取（如需保留可移除此行）
        menu.selected = -1;
    }
}
