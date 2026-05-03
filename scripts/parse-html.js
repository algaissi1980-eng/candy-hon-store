const fs = require('fs');
const cheerio = require('cheerio');

const html = fs.readFileSync('debug.html', 'utf8');
const $ = cheerio.load(html);

const products = [];

// Try to find product cards. Often they have specific classes or data attributes
// Let's just look for img tags and their parent containers
$('a').each((i, el) => {
  const href = $(el).attr('href');
  if (href && href.includes('/products/')) {
    const text = $(el).text().trim();
    const imgSrc = $(el).find('img').attr('src');
    // Let's print out the text to see if it has price
    products.push({ href, text: text.replace(/\n/g, ' ').replace(/\s+/g, ' '), imgSrc });
  }
});

console.log(`Found ${products.length} product links`);
if (products.length > 0) {
  console.log(products.slice(0, 5));
} else {
  // alternative: search for script tags with JSON
  const scriptTags = $('script[type="application/ld+json"]');
  scriptTags.each((i, el) => {
    console.log("JSON-LD:", $(el).html().substring(0, 100));
  });
}
