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
      const heights = await page.locator('.hero-card').evaluateAll(cards=>cards.map(card=>[card.querySelector('.hero-card-copy').getBoundingClientRect().height,card.querySelector('.hero-card-image').getBoundingClientRect().height]));
      if (width > 600) for (const [left,right] of heights) assert.ok(Math.abs(left-right)<2,`asset alignment at ${width}: ${left}/${right}`);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow at ${width}`);
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
