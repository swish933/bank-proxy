const express = require("express");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 8080;
const TENANT_ID = process.env.TENANT_ID || "demo";
const BASE_URL = "http://api.issl.ng:7777";
const upload = multer({ storage: multer.memoryStorage() });

app.use(
	cors({
		origin: process.env.ALLOWED_ORIGIN || "*",
	}),
);
app.use(express.json());

// Health check
app.get("/", (req, res) => {
	res.json({ status: "ok", message: "Bank proxy is running." });
});

// GET /api/banks — fetch list of banks
app.get("/api/banks", async (req, res) => {
	try {
		const response = await fetch(`${BASE_URL}/ibank/api/v1/getAllBanks`, {
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
			`${BASE_URL}/ibank/api/v1/accountNameLookup?bankcode=${bankcode}&nuban=${nuban}`,
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

app.post(
	"/api/send-application",
	upload.single("applicationFile"),
	async (req, res) => {
		try {
			const { clientName, clientEmail } = req.body;
			const pdfBuffer = req.file.buffer; // The PDF file sent from the frontend

			// Configure your email transport (e.g., SMTP details from your provider)
			// const transporter = nodemailer.createTransport({
			// 	host: process.env.EMAIL_HOST,
			// 	port: process.env.EMAIL_PORT || 587,
			// 	secure: false,
			// 	auth: {
			// 		user: process.env.EMAIL_USER,
			// 		pass: process.env.EMAIL_PASS,
			// 	},
			// });

			// Send the email
			// await transporter.sendMail({
			// 	from: '"NSL Onboarding" <no-reply@nslng.com>',
			// 	to: "ikemnomso@isslng.com",
			// 	subject: `New Account Application: ${clientName}`,
			// 	text: `A new application has been submitted by ${clientName} (${clientEmail}). Please find the brief attached.`,
			// 	attachments: [
			// 		{
			// 			filename: req.file.originalname,
			// 			content: pdfBuffer,
			// 		},
			// 	],
			// });

			// const data = await response.json();
			// return res.json(data);

			const response = await fetch(`${BASE_URL}/onboarding-api/2.0/sendmail`, {
				method: "POST",
				headers: {
					"x-tenantid": TENANT_ID,
				},
				body: JSON.stringify({
					from: "NSL Onboarding <no-reply@nslng.com>",
					to: "ikemnomso@isslng.com",
					subject: `New Account Application: ${clientName}`,
					text: `A new application has been submitted by ${clientName} (${clientEmail}). Please find the brief attached.`,
					attachments: [
						{
							pdfBuffer,
						},
					],
				}),
			});

			if (!response.ok) {
				return res.status(response.status).json({
					error: `Upstream API error: ${response.statusText}`,
				});
			}

			res.status(200).json({ message: "Email sent successfully!" });
		} catch (error) {
			console.error("Email sending failed:", error);
			res.status(500).json({ error: "Failed to send email" });
		}
	},
);

// 404 fallback
app.use((req, res) => {
	res.status(404).json({ error: "Route not found." });
});

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Bank proxy running on port ${PORT}`);
});
