const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeProducts() {
  console.log("Launching Puppeteer...");
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Set viewport to a desktop size
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to Vatrin Store...");
  // Using the page_size trick you found!
  await page.goto('https://candy-hon.vatrin.app/?page=1&page_size=300', { waitUntil: 'networkidle2' });

  console.log("Waiting for products to render...");
  await new Promise(r => setTimeout(r, 3000));

  // Scroll to bottom slowly to trigger lazy loading of images
  console.log("Scrolling to load lazy images...");
  await autoScroll(page);

  console.log("Extracting product data...");
  const html = await page.evaluate(() => {
    // Just find divs that contain "JOD" and get their outerHTML
    const priceEls = Array.from(document.querySelectorAll('*')).filter(el => el.innerText && (el.innerText.includes('JOD') || el.innerText.includes('د.ا')));
    if (priceEls.length > 0) {
       // Return the outerHTML of the parent of the first price element
       return priceEls[0].parentElement.outerHTML;
    }
    return document.body.innerHTML.substring(0, 5000);
  });
  fs.writeFileSync('sample_product.html', html);
  console.log("Saved sample structure to sample_product.html");


  await browser.close();
}

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

scrapeProducts().catch(console.error);
