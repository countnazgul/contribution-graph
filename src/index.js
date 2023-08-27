const fs = require("fs");
const puppeteer = require("puppeteer");
const mergeImages = require("merge-images");
const { Canvas, Image } = require("canvas");

const userName = "countnazgul";
const startYear = 2008;
const onlyCurrentYear = true;
const theme = "dark"; // or light

const totalYears = new Date().getFullYear() - startYear;
const years = onlyCurrentYear
  ? [new Date().getFullYear()]
  : Array.from({ length: totalYears + 1 }, (_, i) => i + startYear).reverse();

(async () => {
  const browser = await puppeteer.launch();
  await Promise.all(
    years.map(async (year) => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 1024 });
      await page
        .goto(
          `https://github.com/${userName}?tab=overview&from=${year}-01-01&to=${year}-12-31`,
          { waitUntil: "networkidle0" }
        )
        .catch((err) => console.log(err));
      await page.emulateMediaFeatures([
        {
          name: "prefers-color-scheme",
          value: theme,
        },
      ]);

      await page.waitForSelector(".js-calendar-graph");
      const element = await page.$(".js-calendar-graph");
      await element.screenshot({ path: `./images/${year}.png` });
      await page.close();
      console.log(`${year} complete`);
    })
  );
  await browser.close();

  const availableFiles = fs.readdirSync("./images");

  if (availableFiles[availableFiles.length - 1] == "combined.png")
    availableFiles.pop();

  const y = availableFiles.reverse().map((y, i) => ({
    src: `./images/${y}`,
    x: 0,
    y: i * 115,
  }));

  mergeImages(y, {
    Canvas,
    Image,
    width: 717,
    height: availableFiles.length * 115,
  }).then((b64) => {
    const buffer = Buffer.from(b64.split(",")[1], "base64");
    fs.writeFileSync("./images/combined.png", buffer);
  });
})();
