const fs = require("fs");
const puppeteer = require("puppeteer");
const mergeImages = require("merge-images");
const { Canvas, Image } = require("canvas");

const totalYears = new Date().getFullYear() - 2008;
const years = Array.from(
  { length: totalYears + 1 },
  (_, i) => i + 2008
).reverse();

(async () => {
  const browser = await puppeteer.launch();
  await Promise.all(
    years.map(async (year) => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 1024 });
      await page
        .goto(
          `https://github.com/countnazgul?tab=overview&from=${year}-01-01&to=${year}-12-31`,
          { waitUntil: "networkidle0" }
        )
        .catch((err) => console.log(err));
      await page.waitForSelector(".js-calendar-graph-svg");
      const element = await page.$(".js-calendar-graph-svg");
      await element.screenshot({ path: `./images/${year}.png` });
      await page.close();
      console.log(`${year} complete`);
    })
  );
  await browser.close();

  const y = years.map((y, i) => ({
    src: `../images/${y}.png`,
    x: 0,
    y: i * 115,
  }));

  mergeImages(y, {
    Canvas,
    Image,
    width: 717,
    height: years.length * 115,
  }).then((b64) => {
    const buffer = Buffer.from(b64.split(",")[1], "base64");
    fs.writeFileSync("./images/combined.png", buffer);
  });
})();
