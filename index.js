import express, { json } from "express";
import cors from "cors";
import "dotenv/config";
import { buildPdfHtml, renderPDF } from "./lib/template.js";
import logger from "./logger.js";
import { transporter } from "./lib/mailTransport.js";
import pinoHttp from "pino-http";

const app = express();
const PORT = process.env.PORT || 10000;
const TENANT_ID = process.env.TENANT_ID || "demo";
const BASE_URL = "http://api.issl.ng:7777/ibank/api/v1";
const toEmail = process.env.RECEIPT_EMAIL || "info@nslng.com";

app.use(
	cors({
		origin: process.env.ALLOWED_ORIGIN || "*",
	}),
);

app.use(pinoHttp({ logger }));

// Health check
app.get("/", (req, res) => {
	res.json({ status: "ok", message: "Bank proxy is running." });
});

// GET /api/banks — fetch list of banks
app.get("/api/banks", async (req, res) => {
	try {
		const response = await fetch(`${BASE_URL}/getAllBanks`, {
			method: "GET",
			headers: {
				"x-tenantid": TENANT_ID,
			},
		});

		if (!response.ok) {
			return res.status(response.status).json({
				error: `Upstream API error: ${response.statusText}`,
			});
		}

		const data = await response.json();
		return res.json(data);
	} catch (error) {
		console.error("Error fetching bank list:", error.message);
		return res.status(500).json({ error: "Failed to fetch bank list." });
	}
});

// GET /api/account-name?bankcode=XXX&nuban=XXXXXXXXXX — resolve account name
app.get("/api/account-name", async (req, res) => {
	const { bankcode, nuban } = req.query;

	// Validate inputs before hitting the upstream API
	if (!bankcode) {
		return res
			.status(400)
			.json({ error: "Missing required query param: bankcode" });
	}
	if (!nuban || nuban.length !== 10) {
		return res.status(400).json({ error: "nuban must be exactly 10 digits." });
	}

	try {
		const response = await fetch(
			`${BASE_URL}/accountNameLookup?bankcode=${bankcode}&nuban=${nuban}`,
			{
				method: "GET",
				headers: {
					"X-TENANTID": TENANT_ID,
				},
			},
		);

		if (!response.ok) {
			return res.status(response.status).json({
				error: `Upstream API error: ${response.statusText}`,
			});
		}

		const data = await response.json();
		return res.json(data);
	} catch (error) {
		console.error("Error resolving account name:", error.message);
		return res.status(500).json({ error: "Failed to resolve account name." });
	}
});

/**
 * POST /api/generate-pdf
 * Body: JSON formState object (images as base64 data URIs)
 * Returns: PDF binary with appropriate headers
 */
app.post("/api/generate-pdf", json({ limit: "50mb" }), async (req, res) => {
	try {
		const formState = req.body;
		if (!formState) {
			return res.status(400).json({ error: "formState is required" });
		}

		const html = buildPdfHtml(formState);
		const pdfBuffer = await renderPDF(html);

		const lastName = formState.last_name || "Manifest";
		const filename = `NSL_Onboarding_Brief_${lastName}.pdf`;

		res.set({
			"Content-Type": "application/pdf",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Content-Length": pdfBuffer.length,
		});
		res.send(pdfBuffer);
	} catch (err) {
		console.error("PDF generation error:", err);
		res
			.status(500)
			.json({ error: "PDF generation failed", detail: err.message });
	}
});

/**
 * POST /api/send-application
 * Body: application/json with clientName, clientEmail, and formState (as JSON string)
 * Generates the PDF server-side and emails it
 */
app.post("/api/send-application", json({ limit: "50mb" }), async (req, res) => {
	try {
		const { clientName, clientEmail, formState: formStateJson } = req.body;

		if (!formStateJson) {
			logger.warn("Missing formState in request body");
			return res.status(400).json({ error: "formState JSON is required" });
		}

		const formState = JSON.parse(formStateJson);
		const html = buildPdfHtml(formState);
		const pdfBuffer = await renderPDF(html);

		logger.info({ sizeBytes: pdfBuffer.length }, "PDF generated");

		const lastName = formState.last_name || "Manifest";
		const filename = `NSL_Onboarding_Brief_${lastName}.pdf`;

		res.json({ ok: true, filename });

		// Send the email
		await transporter
			.sendMail({
				from: '"NSL Onboarding" <stockmarket@nslng.com>',
				to: toEmail,
				subject: `New Account Application: ${clientName}`,
				text: `A new application has been submitted by ${clientName} (${clientEmail}). Please find the brief attached.`,
				attachments: [
					{
						filename,
						content: pdfBuffer,
						contentType: "application/pdf",
					},
				],
			})
			.then((info) => {
				logger.info(
					{ messageId: info.messageId, response: info.response },
					"Mail sent",
				);
			})
			.catch((err) => {
				logger.error({ err }, "Mail error");
			});
	} catch (err) {
		logger.error({ err }, "send-application failed");
		res
			.status(500)
			.json({ error: "Application submission failed", detail: err.message });
	}
});

// 404 fallback
app.use((req, res) => {
	res.status(404).json({ error: "Route not found." });
});

app.listen(PORT, "0.0.0.0", () => {
	logger.info(`Bank proxy running on port ${PORT}`);
});
