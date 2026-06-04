import puppeteer from "puppeteer-core";
import { fontFaceCSS } from "../fonts.js";
import chromium from "@sparticuz/chromium";

// ─── PDF HTML Template ────────────────────────────────────────────────────────

function buildPdfHtml(formState) {
	const includesJoint = formState.is_joint === "Yes";
	const includesMinor = formState.is_minor === "Yes";
	const totalDocumentPages = 5 + (includesJoint ? 1 : 0);

	// ── Helpers ──────────────────────────────────────────────────────────────
	const val = (v) =>
		v !== undefined && v !== null && v !== "" ? String(v) : "—";

	function compileBlock(title, items) {
		let cells = "";
		for (const item of items) {
			const widthClass = item.fullWidth ? " pdf-full-row" : "";
			cells += `<div class="pdf-field${widthClass}">
        <strong>${item.label}</strong>
        <span>${val(item.value)}</span>
      </div>`;
		}
		return `<div class="pdf-section">
      <div class="pdf-section-title">${title}</div>
      <div class="pdf-grid">${cells}</div>
    </div>`;
	}

	function createPageHTML(title, subtitle, sectionsHTML, pageNum, totalPages) {
		return `<div class="pdf-page">
      <div class="pdf-header">
        <div class="pdf-header-left">
          <h1>Nigerian Stockbrokers Limited</h1>
          <p>${subtitle}</p>
        </div>
        <div class="pdf-header-right">${title}</div>
      </div>
      ${sectionsHTML}
      <div class="pdf-footer">
        <div>NSL Client Onboarding Matrix Record — Confidential</div>
        <div>Page ${pageNum} of ${totalPages}</div>
      </div>
    </div>`;
	}

	// ── Page 1: Personal Dossier ─────────────────────────────────────────────
	const primaryName =
		`${formState.title || ""} ${formState.first_name || ""} ${formState.middle_name || ""} ${formState.last_name || ""}`.trim();

	let p1Sections = compileBlock("1.1 Personal Demographics", [
		{ label: "Account Classification Group", value: formState.acct_category },
		{ label: "Full Legal Name Structure", value: primaryName },
		{ label: "Gender Designation", value: formState.gender },
		{ label: "Date of Birth", value: formState.dob },
		{ label: "Religious Affiliation", value: formState.religion },
		{ label: "Place of Birth (City/State)", value: formState.place_of_birth },
		{ label: "Current Marital Status", value: formState.marital },
		{ label: "State of Origin Location", value: formState.state_of_origin },
		{ label: "Local Government Area (LGA)", value: formState.lga },
		{
			label: "Mother's Birth Maiden Name",
			value: formState.mothers_maiden_name,
		},
	]);

	p1Sections += compileBlock("1.2 Connectivity & Physical Records", [
		{ label: "Primary Email Address Link", value: formState.email },
		{ label: "Central Securities CHN", value: formState.existing_chn },
		{
			label: "Mobile Telephone Contact",
			value: `(${formState.mobile_country_code || ""}${formState.mobile_city_code || ""}) ${formState.mobile || ""}`,
		},
		{
			label: "Landline Static Telephone",
			value: `(${formState.landline_country_code || ""}${formState.landline_city_code || ""}) ${formState.landline || ""}`,
		},
		{
			label: "Country of Residence Profile",
			value: formState.country_of_residence,
		},
		{
			label: "Declared Nationality Group",
			value: formState.nationality,
		},
		{ label: "Resident Indicator Flag", value: formState.residence_ind },
		{ label: "Date of Cross-Border Entry", value: formState.date_of_entry },
		{ label: "Holds Dual Country Passports?", value: formState.other_passport },
		{
			label: "Dual Passport Country Identity",
			value:
				formState.other_passport === "Yes"
					? formState.other_passport_country
					: "N/A",
		},
		{
			label: "Residential Home Physical Address",
			value: formState.res_address,
			fullWidth: true,
		},
		{
			label: "Postal Mailing Destination Address",
			value: formState.mailing_address,
			fullWidth: true,
		},
	]);

	let page1 = createPageHTML(
		"Personal Dossier",
		"Primary Applicant Identity Summary",
		p1Sections,
		1,
		totalDocumentPages,
	);

	// ── Page 2: Economic Profile ─────────────────────────────────────────────
	let p2Sections = compileBlock("2.1 Statutory Identification Credentials", [
		{ label: "Presented Identification Model", value: formState.id_type },
		{ label: "ID Serial Serial Number", value: formState.id_number },
		{ label: "ID Issuance Calendar Date", value: formState.id_issue_date },
		{
			label: "ID Document Expiry Threshold",
			value: formState.id_expiry_date,
		},
		{
			label: "ID Issuing Authority Location",
			value: formState.id_place_of_issue,
		},
		{ label: "Online Channel System Access?", value: formState.online_access },
		{
			label: "Preferred Channels of Interaction",
			value: Array.isArray(formState.comms_preference)
				? formState.comms_preference.join(", ")
				: val(formState.comms_preference),
		},
	]);

	p2Sections += compileBlock("2.2 Professional Background & Financial Scope", [
		{
			label: "Highest Educational Attainment",
			value: formState.educational_qualification,
		},
		{
			label: "Employment Status Grouping",
			value:
				formState.emp_status === "Others"
					? `Other (${formState.emp_status_other || ""})`
					: formState.emp_status,
		},
		{ label: "Core Occupation Domain", value: formState.occupation },
		{ label: "Corporate Segment Sphere", value: formState.emp_segment },
		{ label: "Designated Professional Title", value: formState.job_title },
		{ label: "Tenure Inside Post (Years)", value: formState.years_employed },
		{ label: "Employer Corporate Title Name", value: formState.company_name },
		{
			label: "Corporate Office Telephone Contact",
			value: `(${formState.office_phone_country_code || ""}${formState.office_phone_city_code || ""}) ${formState.office_phone || ""}`,
		},
		{
			label: "WhatsApp Messaging System ID",
			value: formState.whatsapp_number,
		},
		{
			label: "Enterprise Official Email Address",
			value: formState.office_email,
		},
		{ label: "Average Annual Net Income Range", value: formState.income },
		{
			label: "Verifiable Core Source of Funds",
			value: formState.funds_source,
		},
		{
			label: "Intended System Investment Goal",
			value: formState.invest_purpose,
		},
		{ label: "Acquisition Channel Referral", value: formState.referral },
		{
			label: "Employer Office Building Address",
			value: formState.company_address,
			fullWidth: true,
		},
	]);

	let page2 = createPageHTML(
		"Economic Profile",
		"Identification Metrics & Revenue Framework",
		p2Sections,
		2,
		totalDocumentPages,
	);

	// ── Optional Page 3: Joint Co-Holder ────────────────────────────────────
	let page3 = "";
	let jointPageOffset = 0;
	if (includesJoint && formState.joint) {
		const j = formState.joint;
		jointPageOffset = 1;
		const jointName =
			`${j.title || ""} ${j.first_name || ""} ${j.middle_name || ""} ${j.last_name || ""}`.trim();
		let pJointSections = compileBlock("3.1 Joint Signatory Demographics", [
			{ label: "Full Joint Co-Applicant Name", value: jointName },
			{ label: "Gender Designation", value: j.gender },
			{ label: "Date of Birth", value: j.dob },
			{ label: "Declared Religion Profile", value: j.religion },
			{ label: "Place of Birth Location", value: j.place_of_birth },
			{ label: "Marital Condition Status", value: j.marital },
			{ label: "State of Origin Territory", value: j.state_of_origin },
			{ label: "Local Government Area (LGA)", value: j.lga },
			{ label: "Declared Nationality Title", value: j.nationality },
			{
				label: "Mother's Birth Maiden Name",
				value: j.mothers_maiden_name,
			},
			{ label: "Joint Applicant Email Connection", value: j.email },
			{
				label: "Country of Permanent Residence",
				value: j.country_of_residence,
			},
			{
				label: "Mobile Communication Line",
				value: `(${j.mobile_country_code || ""}${j.mobile_city_code || ""}) ${j.mobile || ""}`,
			},
			{
				label: "Landline Communication Line",
				value: `(${j.landline_country_code || ""}${j.landline_city_code || ""}) ${j.landline || ""}`,
			},
		]);
		pJointSections += compileBlock(
			"3.2 Joint Economic Classification & Identification",
			[
				{
					label: "Highest Educational Attainment",
					value: j.educational_qualification,
				},
				{ label: "Employment Classification Status", value: j.emp_status },
				{ label: "Core Occupation Domain", value: j.occupation },
				{ label: "Designated Professional Title", value: j.job_title },
				{ label: "Employer Corporate Name", value: j.company_name },
				{
					label: "Enterprise Office Telephone Contact",
					value: `(${j.office_phone_country_code || ""}${j.office_phone_city_code || ""}) ${j.office_phone || ""}`,
				},
				{ label: "Official Enterprise Email Link", value: j.office_email },
				{ label: "Average Annual Net Income Range", value: j.income },
				{ label: "Verifiable Source of Capital", value: j.funds_source },
				{ label: "Presented Identification Model", value: j.id_type },
				{ label: "ID Instrument Serial Number", value: j.id_number },
				{ label: "ID Instrument Issuance Date", value: j.id_issue_date },
				{ label: "ID Instrument Expiration Date", value: j.id_expiry_date },
				{ label: "ID Instrument Place of Issue", value: j.id_place_of_issue },
				{
					label: "Residential Home Physical Address",
					value: j.res_address,
					fullWidth: true,
				},
				{
					label: "Postal Mailing Destination Address",
					value: j.mailing_address,
					fullWidth: true,
				},
				{
					label: "Employer Corporate Office Address",
					value: j.company_address,
					fullWidth: true,
				},
			],
		);
		page3 = createPageHTML(
			"Joint Signatory Profile",
			"Secondary Account Holder Structure Dossier",
			pJointSections,
			3,
			totalDocumentPages,
		);
	}

	// ── Page 4: Settlement & Kinship ─────────────────────────────────────────
	const bankPageNum = 3 + jointPageOffset;
	let p3Sections = compileBlock("4.1 Operational Settlement Bank Profile", [
		{ label: "Financial Institution Entity Name", value: formState.bank_name },
		{ label: "Branch Operational Sector", value: formState.bank_branch },
		{ label: "Account Holder Structural Title", value: formState.acct_name },
		{ label: "Account Number Format (NUBAN)", value: formState.acct_number },
		{ label: "Bank Verification Number (BVN)", value: formState.bvn },
		{
			label: "Date Relationship Initialized",
			value: formState.bank_opened_date,
		},
	]);

	if (formState.nok1) {
		const n1 = formState.nok1;
		p3Sections += compileBlock("4.2 Primary Next of Kin Beneficiary Record", [
			{
				label: "Full Primary Beneficiary Name",
				value:
					`${n1.title || ""} ${n1.first_name || ""} ${n1.middle_name || ""} ${n1.last_name || ""}`.trim(),
			},
			{ label: "Date of Birth", value: n1.dob },
			{ label: "Declared Nationality", value: n1.nationality },
			{ label: "Gender Assignment", value: n1.gender },
			{ label: "Kinship Relationship Link", value: n1.relationship },
			{ label: "Electronic Mail Connection", value: n1.email },
			{
				label: "Mobile System Telephone Contact",
				value: `(${n1.tel_country_code || ""}${n1.tel_city_code || ""}) ${n1.tel || ""}`,
			},
			{
				label: "Primary Residential Home Address",
				value: n1.address,
				fullWidth: true,
			},
		]);
	}

	if (formState.nok2 && formState.nok2.first_name) {
		const n2 = formState.nok2;
		p3Sections += compileBlock("4.3 Secondary Next of Kin Beneficiary Record", [
			{
				label: "Full Secondary Beneficiary Name",
				value:
					`${n2.title || ""} ${n2.first_name || ""} ${n2.middle_name || ""} ${n2.last_name || ""}`.trim(),
			},
			{ label: "Date of Birth", value: n2.dob },
			{ label: "Declared Nationality", value: n2.nationality },
			{ label: "Gender Assignment", value: n2.gender },
			{ label: "Kinship Relationship Link", value: n2.relationship },
			{ label: "Electronic Mail Connection", value: n2.email },
			{
				label: "Mobile System Telephone Contact",
				value: `(${n2.tel_country_code || ""}${n2.tel_city_code || ""}) ${n2.tel || ""}`,
			},
			{
				label: "Primary Residential Home Address",
				value: n2.address,
				fullWidth: true,
			},
		]);
	}

	let page4 = createPageHTML(
		"Settlement & Kinship",
		"Financial Allocation Channels & Beneficiaries",
		p3Sections,
		bankPageNum,
		totalDocumentPages,
	);

	// ── Page 5: Compliance Parameters ───────────────────────────────────────
	const compliancePageNum = 4 + jointPageOffset;
	let p4Sections = compileBlock("5.1 Minor Account Trust Safeguards", [
		{
			label: "Is Account Administered for a Minor?",
			value: formState.is_minor,
		},
		{
			label: "Minor Legatee Full Name",
			value: includesMinor ? formState.minor?.name : "N/A",
		},
		{
			label: "Minor Calendar Date of Birth",
			value: includesMinor ? formState.minor?.dob : "N/A",
		},
		{
			label: "Minor Gender Designation",
			value: includesMinor ? formState.minor?.gender : "N/A",
		},
		{
			label: "Guardian Kinship Connection",
			value: includesMinor ? formState.minor?.relationship : "N/A",
		},
	]);

	const politicalArray = [
		{ label: "Is Primary Applicant a PEP?", value: formState.political },
		{
			label: "Stated Public Office Mandate",
			value:
				formState.political === "Yes" ? formState.political_position : "N/A",
		},
		{
			label: "Office Tenure Start Date",
			value:
				formState.political === "Yes" ? formState.political_date_from : "N/A",
		},
		{
			label: "Office Tenure Concluding Date",
			value:
				formState.political === "Yes" ? formState.political_date_to : "N/A",
		},
		{
			label: "Close Proximity Connections to PEP?",
			value: formState.rel_political,
		},
	];
	if (formState.rel_political === "Yes") {
		if (formState.rel_political_1?.name) {
			politicalArray.push({
				label: "[Relation 1] Identification & Linkage",
				value: `${formState.rel_political_1.name} (${formState.rel_political_1.relationship})`,
				fullWidth: true,
			});
			politicalArray.push({
				label: "[Relation 1] Public Role & Office Tenure",
				value: `${formState.rel_political_1.position} [${formState.rel_political_1.date_from} to ${formState.rel_political_1.date_to}]`,
				fullWidth: true,
			});
		}
		if (formState.rel_political_2?.name) {
			politicalArray.push({
				label: "[Relation 2] Identification & Linkage",
				value: `${formState.rel_political_2.name} (${formState.rel_political_2.relationship})`,
				fullWidth: true,
			});
			politicalArray.push({
				label: "[Relation 2] Public Role & Office Tenure",
				value: `${formState.rel_political_2.position} [${formState.rel_political_2.date_from} to ${formState.rel_political_2.date_to}]`,
				fullWidth: true,
			});
		}
	}
	p4Sections += compileBlock(
		"5.2 Anti-Money Laundering (AML) & PEP Matrix",
		politicalArray,
	);

	const filteredTickers = Array.isArray(formState.excluded_stocks)
		? formState.excluded_stocks.filter(Boolean).join(", ")
		: "";
	p4Sections += compileBlock("5.3 Strategy Directives & Asset Restrictions", [
		{
			label: "Specific Equity Security Restrictions?",
			value: formState.exclude_stocks,
		},
		{
			label: "Target Blacklisted Tickers / Ticker Symbols",
			value:
				formState.exclude_stocks === "Yes"
					? filteredTickers || "None Defined"
					: "N/A",
			fullWidth: true,
		},
		{
			label: "Designated Portfolio Asset Mandate",
			value: formState.portfolio_mandate,
		},
	]);

	let page5 = createPageHTML(
		"Compliance Parameters",
		"Minor Safeguards, PEP Assays & Trading Boundaries",
		p4Sections,
		compliancePageNum,
		totalDocumentPages,
	);

	// ── Page 6: Execution Summary + Document Gallery ─────────────────────────
	const executionPageNum = 5 + jointPageOffset;
	let p5Sections = compileBlock(
		"6.1 Attestation & Document Affirmation Signatures",
		[
			{
				label: "Statutory Identification Document Check",
				value: formState.doc_id_uploaded ? "Verified Upload" : "Pending Action",
			},
			{
				label: "Address Verification Document Check",
				value: formState.doc_addr_uploaded
					? "Verified Upload"
					: "Pending Action",
			},
			{
				label: "Client Attestation Declaration",
				value: formState.attested ? "Agreed and Sealed" : "Unsigned",
			},
			{
				label: "Primary Account Signatory Authorization",
				value: formState.sign_name,
			},
			{ label: "Primary Execution Timestamp", value: formState.sign_date },
			{
				label: "Joint Co-Signatory Authorization",
				value: includesJoint ? formState.joint_sign_name : "N/A",
			},
		],
	);

	// Document gallery — images arrive as base64 data URIs from the client
	const assetMap = [
		{ data: formState.passport_photo, tag: "Applicant Passport Photo" },
		{ data: formState.signature, tag: "Applicant Signature Specimen" },
		{ data: formState.id_doc, tag: "Applicant Statutory Identification" },
		{ data: formState.utility_bill, tag: "Applicant Proof of Address" },
		{ data: formState.joint?.passport_photo, tag: "Joint Signatory Photo" },
		{ data: formState.joint?.signature, tag: "Joint Signature Specimen" },
		{ data: formState.joint?.id_doc, tag: "Joint Signatory ID" },
		{ data: formState.joint?.utility_bill, tag: "Joint Proof of Address" },
		{ data: formState.nok1?.passport_photo, tag: "Primary NOK Photo ID" },
		{ data: formState.nok1?.id_doc, tag: "Primary NOK Statutory ID" },
		{ data: formState.nok2?.passport_photo, tag: "Secondary NOK Photo ID" },
		{ data: formState.nok2?.id_doc, tag: "Secondary NOK Statutory ID" },
		{ data: formState.minor?.passport_photo, tag: "Minor Dependent Photo" },
		{
			data: formState.minor?.birth_certificate,
			tag: "Minor Birth Certificate",
		},
	];

	let galleryHTML = "";
	let assetCount = 0;
	for (const asset of assetMap) {
		if (!asset.data) continue;
		if (asset.data === "[PDF_DOCUMENT]") {
			galleryHTML += `<div class="pdf-img-box">
        <span>${asset.tag}</span>
        <div class="pdf-doc-placeholder">📄 PDF Document</div>
      </div>`;
		} else {
			// Expect a base64 data URI string (e.g. "data:image/jpeg;base64,...")
			galleryHTML += `<div class="pdf-img-box">
        <span>${asset.tag}</span>
        <img src="${asset.data}" alt="${asset.tag}" />
      </div>`;
		}
		assetCount++;
	}

	if (assetCount > 0) {
		p5Sections += `<div class="pdf-section">
      <div class="pdf-section-title">6.2 Appendix: System Document Repository Logs</div>
      <div class="pdf-gallery">${galleryHTML}</div>
    </div>`;
	}

	let page6 = createPageHTML(
		"Execution Summary",
		"Attestation Records & System Asset Registry Logs",
		p5Sections,
		executionPageNum,
		totalDocumentPages,
	);

	// ── Assemble full HTML document ──────────────────────────────────────────
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NSL Application</title>
 
  <style>${fontFaceCSS}</style>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Public Sans', sans-serif;
      color: #1c1814;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .pdf-page {
      width: 210mm;
      min-height: 297mm;
      padding: 14mm 15mm 12mm 15mm;
      page-break-after: always;
      background: #ffffff;
      position: relative;
      display: flex;
      flex-direction: column;
    }
    .pdf-page:last-of-type { page-break-after: avoid; }
    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      border-bottom: 2px solid #8b1a1a;
      padding-bottom: 8px;
      margin-bottom: 15px;
      flex-shrink: 0;
    }
    .pdf-header-left h1 {
      color: #8b1a1a;
      margin: 0 0 4px 0;
      font-size: 20px;
      font-family: 'Cormorant Garamond', serif;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .pdf-header-left p { margin: 0; font-size: 11px; color: #4a4238; font-weight: 500; }
    .pdf-header-right { font-size: 10px; color: #c8881a; font-weight: bold; text-transform: uppercase; }
    .pdf-content { flex: 1; }
    .pdf-section {
      margin-bottom: 12px;
      border: 1px solid #e2ddd6;
      border-radius: 6px;
      background: #ffffff;
      overflow: hidden;
      break-inside: avoid;
    }
    .pdf-section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #ffffff;
      background: #8b1a1a;
      padding: 6px 12px;
      font-weight: 700;
    }
    .pdf-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 15px;
      padding: 12px;
      background: #faf9f7;
    }
    .pdf-field { font-size: 11px; line-height: 1.4; }
    .pdf-field strong {
      color: #7a7068;
      display: block;
      font-size: 9px;
      text-transform: uppercase;
      margin-bottom: 2px;
      letter-spacing: 0.3px;
    }
    .pdf-field span { font-size: 12px; color: #1c1814; font-weight: 600; word-break: break-word; }
    .pdf-full-row { grid-column: span 2; }
    .pdf-gallery {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 12px;
      background: #faf9f7;
    }
    .pdf-img-box {
      border: 1px solid #e2ddd6;
      padding: 8px;
      border-radius: 4px;
      text-align: center;
      background: #ffffff;
      break-inside: avoid;
    }
    .pdf-img-box img {
      max-width: 100%;
      height: 100px;
      object-fit: contain;
      display: block;
      margin: 6px auto 0;
      border-radius: 2px;
    }
    .pdf-img-box span {
      font-size: 9px;
      font-weight: 700;
      color: #4a4238;
      text-transform: uppercase;
      display: block;
      border-bottom: 1px solid #f0ede9;
      padding-bottom: 4px;
    }
    .pdf-doc-placeholder {
      font-size: 10px;
      padding: 35px 5px;
      color: #7a7068;
      font-weight: bold;
      background: #f0ede9;
      margin-top: 6px;
      border-radius: 2px;
      text-transform: uppercase;
    }
    .pdf-footer {
      margin-top: auto;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      border-top: 1px solid #e2ddd6;
      font-size: 9px;
      color: #7a7068;
      flex-shrink: 0;
    }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>
  ${page1}
  ${page2}
  ${page3}
  ${page4}
  ${page5}
  ${page6}
</body>
</html>`;
}

// ─── Puppeteer PDF renderer ───────────────────────────────────────────────────
async function renderPDF(html) {
	const isProduction = process.env.NODE_ENV === "production";

	const browser = await puppeteer.launch(
		isProduction
			? {
					args: chromium.args,
					executablePath: await chromium.executablePath(),
					headless: chromium.headless,
				}
			: {
					executablePath:
						"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
					headless: "new",
					args: ["--no-sandbox", "--disable-setuid-sandbox"],
				},
	);

	try {
		const page = await browser.newPage();

		// Block all network requests — fonts, images, etc. Everything is inlined anyway
		await page.setRequestInterception(true);
		page.on("request", (req) => {
			if (["stylesheet", "font", "image"].includes(req.resourceType())) {
				req.abort();
			} else {
				req.continue();
			}
		});

		await page.setContent(html, {
			waitUntil: "domcontentloaded",
			timeout: 60000,
		});
		await new Promise((r) => setTimeout(r, 300));

		const pdfBuffer = await page.pdf({
			format: "A4",
			printBackground: true,
			margin: { top: 0, right: 0, bottom: 0, left: 0 },
		});

		return pdfBuffer;
	} finally {
		await browser.close();
	}
}

export { buildPdfHtml, renderPDF };
