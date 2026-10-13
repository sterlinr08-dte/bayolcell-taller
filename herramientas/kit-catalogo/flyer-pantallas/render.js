const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const dir = __dirname;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const which = process.argv[2] ? [process.argv[2]] : ['feed','story'];
  for (const v of which) {
    const H = v === 'story' ? 1920 : 1350;
    const p2 = await browser.newPage({ viewport: { width: 1080, height: H }, deviceScaleFactor: 2 });
    await p2.goto('file://' + path.join(dir, 'flyer.html') + '?v=' + v);
    await p2.evaluate(() => document.fonts.ready);
    await p2.waitForSelector('body[data-ready="1"]');
    await p2.waitForTimeout(300);
    const fonts = await p2.evaluate(() => [...document.fonts].map(f => f.family + ':' + f.weight + ':' + f.status).join(', '));
    console.log(v, fonts);
    const hi = path.join(dir, 'out', `_hi-${v}.png`);
    await p2.screenshot({ path: hi });
    await p2.close();
    // Downscale 2x render to exact size via Chromium's high-quality image scaling
    const p1 = await browser.newPage({ viewport: { width: 1080, height: H }, deviceScaleFactor: 1 });
    const fs = require('fs');
    const dpath = path.join(dir, 'out', '_down.html');
    fs.writeFileSync(dpath, `<html><body style="margin:0;background:#000"><img id="i" src="_hi-${v}.png" style="display:block;width:1080px;height:${H}px"></body></html>`);
    await p1.goto('file://' + dpath);
    await p1.waitForFunction(() => { const i = document.getElementById('i'); return i.complete && i.naturalWidth === 2160; });
    await p1.screenshot({ path: path.join(dir, 'out', `flyer-pantallas-${v}.png`) });
    await p1.screenshot({ path: path.join(dir, 'out', `flyer-pantallas-${v}.jpg`), type: 'jpeg', quality: 92 });
    await p1.close();
  }
  await browser.close();
})();
