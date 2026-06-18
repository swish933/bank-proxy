// test-pdf.js
import puppeteer from "puppeteer-core";
import "dotenv/config";

const CHROMIUM_PATH = process.env.CHROME_PATH || "/usr/bin/chromium-browser";
// const CHROMIUM_PATH = "C:\\pdf_generation_system\\chrome-win64\\chrome.exe";

async function test() {
	console.log("1. Attempting to launch Chrome...");
	const browser = await puppeteer.launch({
		executablePath: CHROMIUM_PATH,
		headless: "new",
		args: ["--no-sandbox", "--disable-gpu"],
	});
	console.log("2. Chrome launched! Attempting to open a new page...");

	const page = await browser.newPage();
	console.log("3. Page opened successfully! Trying to set content...");

	await page.setContent("<h1>Hello World</h1>", {
		waitUntil: "domcontentloaded",
	});
	console.log("4. Content set! Generating PDF...");

	const pdf = await page.pdf({ format: "A4" });
	console.log(`5. Success! PDF generated. Size: ${pdf.length} bytes`);

	await browser.close();
	console.log("6. Browser closed cleanly.");
}

test().catch((err) => console.error("❌ CRASHED:", err));
