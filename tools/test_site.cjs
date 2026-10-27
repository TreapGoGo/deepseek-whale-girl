// Browser regression checks for the static site. Usage: node tools/test_site.cjs
// Install Playwright, or pass its module directory as the first argument.
const { chromium } = require(process.argv[2] || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const root = path.resolve(__dirname, '../site');
const review = path.resolve(__dirname, '../.community-review');
fs.mkdirSync(review, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'assets/gallery/manifest.json'), 'utf8')).works;
const expected = manifest.filter(x => x.gallery !== false).length;
const handmade = manifest.filter(x => x.handmade && x.gallery !== false).length;
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.json':'application/json', '.css':'text/css; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.jpg':'image/jpeg', '.zip':'application/zip', '.md':'text/plain; charset=utf-8' };
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
async function main() {
  await new Promise(resolve => server.listen(4180, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless:true, channel:process.platform === 'win32' ? 'msedge' : undefined });
  const results = [];
  try {
    for (const width of [1440, 1024, 768, 390, 320]) {
      const context = await browser.newContext({viewport:{width,height:900},permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
      const page = await context.newPage();
      const errors=[];
      page.on('pageerror', e=>errors.push(e.message));
      // Simulate one failed preview; layout must still render every card.
      await page.route('**/issue-15-01-preview.webp',route=>route.abort());
      await page.goto('http://127.0.0.1:4180/',{waitUntil:'domcontentloaded'});
      await page.waitForFunction(count=>document.querySelectorAll('.gallery-tile').length===count,expected);
      assert.equal(await page.locator('.gallery-row .gallery-tile').count(),expected);
      // Reviewed October submissions: work images only, corrected image keeps its old permalink.
      for(const number of [58,59,63,65,70,74]) assert.equal(await page.locator('#resource-'+number).count(),1);
      for(const id of ['issue-31-01','issue-62-01','issue-73-01']) assert.equal(await page.locator('#'+id).count(),1);
      for(const id of ['issue-69-02','issue-69-03','issue-69-04','issue-73-02']) assert.equal(await page.locator('#'+id).count(),0);
      assert.ok((await page.locator('#issue-41-01 img').getAttribute('src')).includes('issue-61-01'));
      assert.equal(await page.locator('#issue-41-01 a').first().getAttribute('data-issue-url'),'https://github.com/TreapGoGo/deepseek-whale-girl/issues/61');
      const heights = await page.locator('.hero-card').evaluateAll(cards=>cards.map(card=>[card.querySelector('.hero-card-copy').getBoundingClientRect().height,card.querySelector('.hero-card-image').getBoundingClientRect().height]));
      if (width > 600) for (const [left,right] of heights) assert.ok(Math.abs(left-right)<2,`asset alignment at ${width}: ${left}/${right}`);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow at ${width}`);
      // 章节目录复用首页入口；窄屏继续使用顶部菜单。
      const chapters = page.locator('.chapter-nav');
      assert.equal(await chapters.count(),1);
      assert.deepEqual(await chapters.locator('a').evaluateAll(links=>links.map(a=>[a.hash,a.textContent.trim()])),
        await page.locator('.nav-home-menu a').evaluateAll(links=>links.map(a=>[a.hash,a.textContent.trim()])));
      assert.equal(await chapters.isVisible(),width>=1440);
      if (width>=1440) {
        await page.emulateMedia({reducedMotion:'reduce'});
        const chapterToggle=chapters.locator('.chapter-nav-toggle');
        assert.equal(await chapterToggle.count(),1);
        assert.equal((await chapterToggle.textContent()).trim(),'收起');
        assert.equal(await chapterToggle.locator('svg[aria-hidden="true"]').count(),1);
        const activeColor=await chapters.locator('[aria-current="location"]').evaluate(a=>getComputedStyle(a).backgroundColor);
        const candidate=chapters.locator('a[href="#purpose"]');
        const candidateColor=await candidate.evaluate(a=>getComputedStyle(a).color);
        await candidate.hover();
        const hoverColor=await candidate.evaluate(a=>getComputedStyle(a).backgroundColor);
        assert.equal(hoverColor,'rgba(0, 0, 0, 0)','候选项悬停不显示背景');
        assert.notEqual(await candidate.evaluate(a=>getComputedStyle(a).color),candidateColor);
        assert.equal(await chapters.locator('[aria-current="location"]').evaluate(a=>getComputedStyle(a).backgroundColor),activeColor);
        await chapterToggle.hover();
        await page.waitForFunction(()=>document.querySelector('.chapter-nav-toggle').matches(':hover'));
        assert.equal(await chapterToggle.evaluate(b=>getComputedStyle(b).backgroundColor),'rgba(0, 0, 0, 0)','收起按钮悬停不显示高亮背景');
        await chapterToggle.click();
        assert.equal(await chapterToggle.getAttribute('aria-expanded'),'false');
        assert.equal((await chapterToggle.textContent()).trim(),'展开');
        assert.equal(await chapters.locator('a').first().isVisible(),false);
        const collapsedBounds=await chapters.boundingBox();
        await page.mouse.move(800,250);
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('.chapter-nav-toggle')).opacity==='0');
        assert.equal(await chapters.evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');
        await page.screenshot({path:path.join(review,'chapters-1440-collapsed-hidden.png')});
        await page.mouse.move(collapsedBounds.x-4,collapsedBounds.y+20);
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('.chapter-nav-toggle')).opacity==='1');
        await page.screenshot({path:path.join(review,'chapters-1440-collapsed.png')});
        await page.mouse.move(800,250);
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('.chapter-nav-toggle')).opacity==='0');
        // 左侧感应区覆盖整个高度，不限于展开按钮附近。
        for (const y of [150,850]) {
          await page.mouse.move(4,y);
          await page.waitForFunction(()=>getComputedStyle(document.querySelector('.chapter-nav-toggle')).opacity==='1');
          await page.mouse.move(800,250);
          await page.waitForFunction(()=>getComputedStyle(document.querySelector('.chapter-nav-toggle')).opacity==='0');
        }
        assert.equal(await page.locator('.brand').evaluate(a=>{
          const r=a.getBoundingClientRect();
          return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('.brand')===a;
        }),true,'感应区不能挡住顶栏链接');
        await chapterToggle.focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Shift+Tab');
        assert.equal(await chapterToggle.evaluate(b=>b===document.activeElement),true);
        await page.waitForFunction(()=>getComputedStyle(document.querySelector('.chapter-nav-toggle')).opacity==='1');
        await chapterToggle.press('Enter');
        assert.equal(await chapterToggle.getAttribute('aria-expanded'),'true');
        assert.equal(await chapters.locator('a').first().isVisible(),true);
        await page.screenshot({path:path.join(review,'chapters-1440-home.png')});
        for (const id of ['prompts','purpose','links','gallery']) {
          await chapters.locator(`a[href="#${id}"]`).click();
          await page.waitForFunction(id=>document.querySelector('.chapter-nav [aria-current="location"]')?.hash==='#'+id,id);
          assert.equal(new URL(page.url()).hash,'#'+id);
          const bounds=await page.evaluate(id=>({target:document.getElementById(id).getBoundingClientRect().top,header:document.querySelector('.topbar').getBoundingClientRect().bottom}),id);
          assert.ok(bounds.target>=bounds.header,`chapter hidden by header: ${id}`);
          const clear=await page.evaluate(id=>{
            const nav=document.querySelector('.chapter-nav').getBoundingClientRect();
            const content=document.querySelector(({prompts:'.hero-stack',purpose:'.info-section > div',links:'.links-heading',gallery:'.gallery-heading'})[id]).getBoundingClientRect();
            return nav.left>=0&&nav.right+4<=content.left;
          },id);
          assert.ok(clear,`chapter navigation overlaps content: ${id}`);
          await page.waitForTimeout(250);
          await page.waitForFunction(()=>[...document.querySelectorAll('main img')].filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}).every(img=>img.complete));
          await page.screenshot({path:path.join(review,`chapters-1440-${id}.png`)});
        }
        // 手动滚动不依赖 hash；整个长画廊内始终保留画廊状态。
        for (const id of ['purpose','links','gallery']) {
          await page.evaluate(id=>window.scrollTo({top:document.getElementById(id).getBoundingClientRect().top+scrollY+140,behavior:'instant'}),id);
          await page.waitForFunction(id=>document.querySelector('.chapter-nav [aria-current="location"]')?.hash==='#'+id,id);
          assert.equal(await chapters.locator('[aria-current]').count(),1);
        }
        await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        await page.waitForFunction(()=>document.querySelector('.chapter-nav [aria-current="location"]')?.hash==='#prompts');
        const firstChapter=chapters.locator('a').first();
        await firstChapter.focus();
        await page.keyboard.press('Tab');
        assert.equal(await chapters.locator('a[href="#purpose"]').evaluate(a=>a===document.activeElement),true);
        await page.keyboard.press('Enter');
        await page.waitForFunction(()=>location.hash==='#purpose');
        await page.emulateMedia({reducedMotion:'no-preference'});
      }
      const toggle=page.locator('.handmade-mode-toggle');
      await toggle.click();
      assert.equal(await page.locator('.masonry-gallery .gallery-tile').count(),handmade);
      assert.equal(await toggle.getAttribute('aria-pressed'),'true');
      const first=page.locator('.gallery-tile').first();
      await first.locator('a').first().click();
      await page.waitForFunction(()=>document.querySelector('#lightbox-image').complete&&document.querySelector('#lightbox-image').naturalWidth>0);
      assert.equal(await page.locator('#gallery-lightbox').evaluate(e=>e.open),true);
      assert.ok((await page.locator('#lightbox-image').getAttribute('src')).endsWith('.webp'));
      assert.equal(await page.locator('.lightbox-source').isVisible(),true);
      await page.locator('.lightbox-copy-button').click();
      await page.waitForFunction(()=>document.querySelector('.lightbox-copy-button').textContent.includes('已复制'));
      assert.deepEqual(await page.evaluate(async()=>(await navigator.clipboard.read())[0].types),['image/png']);
      const [download]=await Promise.all([page.waitForEvent('download'),page.locator('.lightbox-download-link').click()]);
      assert.ok(download.suggestedFilename().endsWith('.webp'));
      await page.locator('.lightbox-frame').click({position:{x:2,y:2}});
      assert.equal(await page.locator('#gallery-lightbox').evaluate(e=>e.open),false);
      await toggle.click();
      assert.equal(await page.locator('.masonry-gallery .gallery-tile').count(),expected);
      await page.locator('#issue-66-01 a').first().click({position:{x:6,y:6}});
      assert.equal(await page.locator('.lightbox-license').isVisible(),true);
      await page.locator('.lightbox-frame').click({position:{x:2,y:2}});
      await page.locator('#issue-73-01 a').first().click({position:{x:6,y:6}});
      assert.equal(await page.locator('.lightbox-license').isVisible(),false);
      await page.locator('.lightbox-frame').click({position:{x:2,y:2}});
      await page.locator('#gallery').scrollIntoViewIfNeeded();
      await page.mouse.move(0, 0);
      await page.waitForFunction(()=>[...document.querySelectorAll('.gallery-tile img')].filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}).every(img=>img.complete));
      await page.waitForTimeout(250);
      await page.screenshot({path:path.join(review,`gallery-${width}.png`)});
      // Preview failure is local to its tile; it cannot block the gallery.
      await page.locator('#issue-15-01').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>document.querySelector('#issue-15-01').classList.contains('image-unavailable'));
      assert.equal(await page.locator('.gallery-row .gallery-tile').count(),expected);
      const firstOrder=await page.locator('.gallery-tile').evaluateAll(x=>x.map(e=>e.id).join(','));
      await page.reload({waitUntil:'domcontentloaded'});
      await page.waitForFunction(count=>document.querySelectorAll('.gallery-tile').length===count,expected);
      const secondOrder=await page.locator('.gallery-tile').evaluateAll(x=>x.map(e=>e.id).join(','));
      assert.notEqual(firstOrder,secondOrder,'random order');
      await page.goto('http://127.0.0.1:4180/index.html#issue-38-01',{waitUntil:'domcontentloaded'});
      assert.equal(await page.locator('#issue-38-01.is-handmade').count(),1);
      for(const route of ['project.html','contribute.html','workflows.html']) {
        await page.goto('http://127.0.0.1:4180/'+route,{waitUntil:'domcontentloaded'});
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} overflow at ${width}`);
      }
      const response=await page.request.get('http://127.0.0.1:4180/assets/workflows/comfyui-issue-2.zip');
      assert.equal(response.status(),200);
      assert.equal(errors.length,0,errors.join(';'));
      results.push({width,gallery:expected,handmade,alignment:true,copy:true,download:true,lightbox:true,failedImageIsolation:true,random:true});
      await context.close();
      console.log('PASS',width);
    }
    // 无脚本时四个原生链接仍可跳转，不依赖滚动增强逻辑。
    const plain=await browser.newContext({viewport:{width:1440,height:900},javaScriptEnabled:false,reducedMotion:'reduce'});
    const plainPage=await plain.newPage();
    await plainPage.goto('http://127.0.0.1:4180/',{waitUntil:'domcontentloaded'});
    assert.equal(await plainPage.locator('.chapter-nav button').isVisible(),false);
    for (const id of ['prompts','purpose','links','gallery']) {
      await plainPage.locator(`.chapter-nav a[href="#${id}"]`).click();
      assert.equal(new URL(plainPage.url()).hash,'#'+id);
    }
    await plain.close();
    results.push({chapterNavigation:true,noScriptAnchors:true});
    const wide=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'reduce'});
    const widePage=await wide.newPage();
    await widePage.goto('http://127.0.0.1:4180/',{waitUntil:'domcontentloaded'});
    assert.equal(await widePage.locator('.chapter-nav').isVisible(),true);
    await widePage.screenshot({path:path.join(review,'chapters-1920-home.png')});
    await widePage.locator('.chapter-nav-toggle').click();
    await widePage.mouse.move(600,250);
    await widePage.waitForFunction(()=>getComputedStyle(document.querySelector('.chapter-nav-toggle')).opacity==='0');
    await widePage.mouse.move(4,1040);
    await widePage.waitForFunction(()=>getComputedStyle(document.querySelector('.chapter-nav-toggle')).opacity==='1');
    await widePage.setViewportSize({width:1439,height:900});
    assert.equal(await widePage.locator('.chapter-nav').isVisible(),false);
    await widePage.setViewportSize({width:1440,height:480});
    assert.equal(await widePage.locator('.chapter-nav').isVisible(),false);
    await wide.close();
    // A real touch-capable context: buttons stay usable without hover and license actions fit.
    const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,permissions:['clipboard-read','clipboard-write'],acceptDownloads:true});
    const mobile=await touch.newPage();
    await mobile.goto('http://127.0.0.1:4180/index.html#issue-66-01',{waitUntil:'domcontentloaded'});
    await mobile.locator('#issue-66-01 a').first().tap({position:{x:6,y:6}});
    await mobile.waitForFunction(()=>document.querySelector('#lightbox-image').complete&&document.querySelector('#lightbox-image').naturalWidth>0);
    assert.equal(await mobile.locator('.lightbox-license').isVisible(),true);
    assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'touch lightbox overflow');
    await mobile.locator('.lightbox-copy-button').tap();
    await mobile.waitForFunction(()=>document.querySelector('.lightbox-copy-button').textContent.includes('已复制'));
    await mobile.touchscreen.tap(2,2);
    assert.equal(await mobile.locator('#gallery-lightbox').evaluate(e=>e.open),false);
    await mobile.locator('.handmade-mode-toggle').tap();
    assert.equal(await mobile.locator('.masonry-gallery .gallery-tile').count(),handmade);
    assert.equal(await mobile.locator('#issue-53-01 .gallery-copy-button').isVisible(),true);
    await touch.close();
    results.push({touch:true,license:true,copy:true,handmade});
    // Public page verification after deployment, when LIVE_SITE is supplied.
    if(process.env.LIVE_SITE) {
      const page=await browser.newPage({viewport:{width:1440,height:900}});
      await page.goto(process.env.LIVE_SITE,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(count=>document.querySelectorAll('.gallery-tile').length===count,expected,{timeout:60000});
      assert.equal(await page.locator('#resource-37').count(),1);
      await page.locator('.handmade-mode-toggle').click();
      assert.equal(await page.locator('.masonry-gallery .gallery-tile').count(),handmade);
      const response=await page.request.get(new URL('assets/workflows/comfyui-issue-2.zip',process.env.LIVE_SITE).href);
      assert.equal(response.status(),200);
      await page.locator('#gallery').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>[...document.querySelectorAll('.gallery-tile img')].filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;}).every(img=>img.complete));
      await page.waitForTimeout(250);
      await page.screenshot({path:path.join(review,'live-gallery.png')});
      results.push({live:true,gallery:expected,handmade,workflowZip:true});
      await page.close();
    }
    fs.writeFileSync(path.join(review,'browser-tests.json'),JSON.stringify(results,null,2));
    console.log(JSON.stringify(results));
  } finally {await browser.close();server.close();}
}
main().catch(e=>{console.error(e);server.close();process.exitCode=1;});
