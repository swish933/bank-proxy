const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;
const TENANT_ID = process.env.TENANT_ID || "demo";
const BASE_URL = "http://api.issl.ng:7777/ibank/api/v1";

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

// 404 fallback
app.use((req, res) => {
	res.status(404).json({ error: "Route not found." });
});

app.listen(PORT, "0.0.0.0", () => {
	console.log(`Bank proxy running on port ${PORT}`);
});
