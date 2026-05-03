const fs = require('fs');

async function checkSite() {
  console.log("Fetching https://candy-hon.vatrin.app/...");
  try {
    const res = await fetch('https://candy-hon.vatrin.app/?shared=true&utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnUpdtd_gMdMBEhECruNvGWIp4ic5g6kzK0SvG7wm8flBefQ3Rp7kUiJNgiKg_aem_xeU4eJYmFYpJmlDRtjFnpQ');
    const html = await res.text();
    console.log(`HTML length: ${html.length}`);
    
    // Check if it's a Next.js app
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      console.log("FOUND __NEXT_DATA__! Saving to next-data.json");
      fs.writeFileSync('next-data.json', nextDataMatch[1]);
      const data = JSON.parse(nextDataMatch[1]);
      console.log("Parsed JSON successfully. Checking props...");
      // Explore structure
      if (data.props && data.props.pageProps) {
        console.log(Object.keys(data.props.pageProps));
      }
    } else {
      console.log("No __NEXT_DATA__ found. Saving html to debug.html");
      fs.writeFileSync('debug.html', html);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

checkSite();
