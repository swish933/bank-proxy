import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";
import path from "node:path";
import logger from "../logger.js";

const BRAND_PAGE_PATH = path.join(process.cwd(), "assets", "brandpage.pdf");

// Cached in memory after first load — avoids re-reading from disk on every request.
let brandPageBytesPromise = null;

function loadBrandPageBytes() {
	if (!brandPageBytesPromise) {
		brandPageBytesPromise = readFile(BRAND_PAGE_PATH).catch((err) => {
			// Reset so a transient failure (e.g. file briefly unavailable) can retry
			// on the next call instead of permanently caching a rejected promise.
			brandPageBytesPromise = null;
			throw err;
		});
	}
	return brandPageBytesPromise;
}

/**
 * Prepends the static brand/cover page PDF to the front of a dynamically
 * generated PDF buffer and returns the combined PDF as a Buffer.
 *
 * @param {Buffer | Uint8Array} generatedPdfBytes - the dynamically generated PDF
 * @returns {Promise<Buffer>} the merged PDF (brand page + generated content)
 */
async function prependBrandPage(generatedPdfBytes) {
	const [brandBytes, generatedDoc] = await Promise.all([
		loadBrandPageBytes(),
		PDFDocument.load(generatedPdfBytes),
	]);

	const brandDoc = await PDFDocument.load(brandBytes);
	const finalDoc = await PDFDocument.create();

	const brandPages = await finalDoc.copyPages(
		brandDoc,
		brandDoc.getPageIndices(),
	);
	brandPages.forEach((p) => finalDoc.addPage(p));

	const contentPages = await finalDoc.copyPages(
		generatedDoc,
		generatedDoc.getPageIndices(),
	);
	contentPages.forEach((p) => finalDoc.addPage(p));

	const finalBytes = await finalDoc.save();

	logger.info(
		{ sizeBytes: finalBytes.length, brandPages: brandPages.length },
		"Brand page prepended to generated PDF",
	);

	return Buffer.from(finalBytes);
}

export { prependBrandPage };
