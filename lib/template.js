import puppeteer from "puppeteer-core";
import { fontFaceCSS } from "../fonts.js";

function buildPdfHtml(formState) {
	const includesJoint = formState.is_joint === "Yes";
	const includesMinor = formState.is_minor === "Yes";
	// 7 new static pages added after the form pages (Indemnification split across 2)
	const totalDocumentPages = 5 + (includesJoint ? 1 : 0) + 7;

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
        <div>NSL Client Onboarding — Confidential</div>
        <div>Page ${pageNum} of ${totalPages}</div>
      </div>
    </div>`;
	}

	/** Render a page made entirely of prose sections (no field grid) */
	function createStaticPageHTML(
		title,
		subtitle,
		bodyHTML,
		pageNum,
		totalPages,
	) {
		return `<div class="pdf-page">
      <div class="pdf-header">
        <div class="pdf-header-left">
          <h1>Nigerian Stockbrokers Limited</h1>
          <p>${subtitle}</p>
        </div>
        <div class="pdf-header-right">${title}</div>
      </div>
      <div class="pdf-static-body">${bodyHTML}</div>
      <div class="pdf-footer">
        <div>NSL Client Onboarding — Confidential</div>
        <div>Page ${pageNum} of ${totalPages}</div>
      </div>
    </div>`;
	}

	// ── Page 1: Individual Account Opening Form ───────────────────────────────
	const primaryName =
		`${formState.title || ""} ${formState.first_name || ""} ${formState.middle_name || ""} ${formState.last_name || ""}`.trim();

	let p1Sections = compileBlock("Individual Account Opening Form", [
		{ label: "Category of Account", value: formState.acct_category },
		{ label: "Title", value: formState.title },
		{ label: "First Name", value: formState.first_name },
		{ label: "Middle Name", value: formState.middle_name },
		{ label: "Last Name", value: formState.last_name },
		{ label: "Gender", value: formState.gender },
		{ label: "Religion", value: formState.religion },
		{ label: "Date of Birth (dd/mm/yyyy)", value: formState.dob },
		{ label: "Place / Country of Birth", value: formState.place_of_birth },
		{ label: "Marital Status", value: formState.marital },
		{
			label: "State of Origin (Nigerians only)",
			value: formState.state_of_origin,
		},
		{ label: "LGA", value: formState.lga },
		{ label: "Mother's Maiden Name", value: formState.mothers_maiden_name },
		{ label: "Personal Email Address", value: formState.email },
		{ label: "Existing CHN", value: formState.existing_chn },
		{
			label: "Mobile No",
			value: `(${formState.mobile_country_code || ""}${formState.mobile_city_code || ""}) ${formState.mobile || ""}`,
		},
		{
			label: "Landline No",
			value: `(${formState.landline_country_code || ""}${formState.landline_city_code || ""}) ${formState.landline || ""}`,
		},
		{ label: "Country of Residence", value: formState.country_of_residence },
		{ label: "Nationality", value: formState.nationality },
		{ label: "Residence Indicator", value: formState.residence_ind },
		{
			label: "Date of Entry into Present Residence (Non-Nigerians)",
			value: formState.date_of_entry,
		},
		{
			label: "Do you carry other country's passport other than Nigeria?",
			value: formState.other_passport,
		},
		{
			label: "If yes, state the country",
			value:
				formState.other_passport === "Yes"
					? formState.other_passport_country
					: "N/A",
		},
		{
			label: "Residential Address",
			value: formState.res_address,
			fullWidth: true,
		},
		{
			label: "Mailing Address",
			value: formState.mailing_address,
			fullWidth: true,
		},
	]);

	let page1 = createPageHTML(
		"Individual Account Opening Form",
		"Primary Applicant",
		p1Sections,
		1,
		totalDocumentPages,
	);

	// ── Page 2: Employment Details ────────────────────────────────────────────
	let p2Sections = compileBlock("Identification", [
		{ label: "ID Type", value: formState.id_type },
		{ label: "ID No", value: formState.id_number },
		{ label: "Issue Date", value: formState.id_issue_date },
		{ label: "Expiry Date", value: formState.id_expiry_date },
		{ label: "Place of Issue", value: formState.id_place_of_issue },
		{
			label: "Do you want to have online access to your account?",
			value: formState.online_access,
		},
		{
			label: "Preferred Means of Communication",
			value: Array.isArray(formState.comms_preference)
				? formState.comms_preference.join(", ")
				: val(formState.comms_preference),
		},
	]);

	p2Sections += compileBlock("Employment Details", [
		{
			label: "Educational Qualification",
			value: formState.educational_qualification,
		},
		{
			label: "Employment Status",
			value:
				formState.emp_status === "Others"
					? `Others: ${formState.emp_status_other || ""}`
					: formState.emp_status,
		},
		{ label: "Occupation / Line of Business", value: formState.occupation },
		{ label: "Occupation / Employment Segment", value: formState.emp_segment },
		{ label: "Job Title", value: formState.job_title },
		{
			label: "No. of years in present employment",
			value: formState.years_employed,
		},
		{ label: "Company / Business Name", value: formState.company_name },
		{
			label: "Official Telephone Number(s)",
			value: `(${formState.office_phone_country_code || ""}${formState.office_phone_city_code || ""}) ${formState.office_phone || ""}`,
		},
		{ label: "WhatsApp No", value: formState.whatsapp_number },
		{ label: "Official Email Address", value: formState.office_email },
		{ label: "Average Annual Income", value: formState.income },
		{
			label: "Sources of Funds to Operate Account",
			value: formState.funds_source,
		},
		{ label: "Purpose of Investment", value: formState.invest_purpose },
		{
			label: "Who introduced you to Nigerian Stockbrokers Limited?",
			value: formState.referral,
		},
		{
			label: "Company / Office Address",
			value: formState.company_address,
			fullWidth: true,
		},
	]);

	let page2 = createPageHTML(
		"Employment Details",
		"Primary Applicant",
		p2Sections,
		2,
		totalDocumentPages,
	);

	// ── Optional Page 3: Joint Account Holder ────────────────────────────────
	let page3 = "";
	let jointPageOffset = 0;
	if (includesJoint && formState.joint) {
		const j = formState.joint;
		jointPageOffset = 1;
		let pJointSections = compileBlock("Joint Account Holder", [
			{ label: "Title", value: j.title },
			{ label: "First Name", value: j.first_name },
			{ label: "Middle Name", value: j.middle_name },
			{ label: "Last Name", value: j.last_name },
			{ label: "Gender", value: j.gender },
			{ label: "Religion", value: j.religion },
			{ label: "Date of Birth (dd/mm/yyyy)", value: j.dob },
			{ label: "Place / Country of Birth", value: j.place_of_birth },
			{ label: "Marital Status", value: j.marital },
			{ label: "State of Origin (Nigerians only)", value: j.state_of_origin },
			{ label: "LGA", value: j.lga },
			{ label: "Mother's Maiden Name", value: j.mothers_maiden_name },
			{ label: "Personal Email Address", value: j.email },
			{ label: "Country of Residence", value: j.country_of_residence },
			{ label: "Nationality", value: j.nationality },
			{ label: "Residence Indicator", value: j.residence_ind },
			{
				label: "If yes, state the country",
				value: j.other_passport === "Yes" ? j.other_passport_country : "N/A",
			},
			{
				label: "Mobile No",
				value: `(${j.mobile_country_code || ""}${j.mobile_city_code || ""}) ${j.mobile || ""}`,
			},
			{
				label: "Landline No",
				value: `(${j.landline_country_code || ""}${j.landline_city_code || ""}) ${j.landline || ""}`,
			},
			{ label: "Residential Address", value: j.res_address, fullWidth: true },
			{ label: "Mailing Address", value: j.mailing_address, fullWidth: true },
		]);
		pJointSections += compileBlock(
			"Employment Details (Joint Account Holder)",
			[
				{
					label: "Educational Qualification",
					value: j.educational_qualification,
				},
				{ label: "Employment Status", value: j.emp_status },
				{ label: "Occupation / Line of Business", value: j.occupation },
				{ label: "Job Title", value: j.job_title },
				{ label: "Company / Business Name", value: j.company_name },
				{
					label: "Official Telephone Number(s)",
					value: `(${j.office_phone_country_code || ""}${j.office_phone_city_code || ""}) ${j.office_phone || ""}`,
				},
				{ label: "Official Email Address", value: j.office_email },
				{ label: "Average Annual Income", value: j.income },
				{ label: "Sources of Funds to Operate Account", value: j.funds_source },
				{ label: "ID Type", value: j.id_type },
				{ label: "ID No", value: j.id_number },
				{ label: "Issue Date", value: j.id_issue_date },
				{ label: "Expiry Date", value: j.id_expiry_date },
				{ label: "Place of Issue", value: j.id_place_of_issue },
				{
					label: "Company / Office Address",
					value: j.company_address,
					fullWidth: true,
				},
			],
		);
		page3 = createPageHTML(
			"Joint Account Holder",
			"If Account is Joint, this section is to be completed by the second signatory",
			pJointSections,
			3,
			totalDocumentPages,
		);
	}

	// ── Page 4: Bank Details & Next of Kin ───────────────────────────────────
	const bankPageNum = 3 + jointPageOffset;
	let p3Sections = compileBlock("Bank Details", [
		{ label: "Bank Name", value: formState.bank_name },
		{ label: "Branch", value: formState.bank_branch },
		{ label: "Account Name", value: formState.acct_name },
		{ label: "Account Number (NUBAN)", value: formState.acct_number },
		{ label: "Bank Verification Number", value: formState.bvn },
		{
			label: "Date Bank Account was opened (dd/mm/yyyy)",
			value: formState.bank_opened_date,
		},
	]);

	if (formState.nok1) {
		const n1 = formState.nok1;
		p3Sections += compileBlock("Next of Kin Details — First Next of Kin", [
			{ label: "Title", value: n1.title },
			{ label: "First Name", value: n1.first_name },
			{ label: "Middle Name", value: n1.middle_name },
			{ label: "Last Name", value: n1.last_name },
			{ label: "Date of Birth", value: n1.dob },
			{ label: "Nationality", value: n1.nationality },
			{ label: "Gender", value: n1.gender },
			{ label: "Relationship", value: n1.relationship },
			{ label: "Email Address", value: n1.email },
			{
				label: "Tel No.",
				value: `(${n1.tel_country_code || ""}${n1.tel_city_code || ""}) ${n1.tel || ""}`,
			},
			{
				label: "Contact Address of Next of Kin",
				value: n1.address,
				fullWidth: true,
			},
		]);
	}

	if (formState.nok2 && formState.nok2.first_name) {
		const n2 = formState.nok2;
		p3Sections += compileBlock("Next of Kin Details — Second Next of Kin", [
			{ label: "Title", value: n2.title },
			{ label: "First Name", value: n2.first_name },
			{ label: "Middle Name", value: n2.middle_name },
			{ label: "Last Name", value: n2.last_name },
			{ label: "Date of Birth", value: n2.dob },
			{ label: "Nationality", value: n2.nationality },
			{ label: "Gender", value: n2.gender },
			{ label: "Relationship", value: n2.relationship },
			{ label: "Email Address", value: n2.email },
			{
				label: "Tel No.",
				value: `(${n2.tel_country_code || ""}${n2.tel_city_code || ""}) ${n2.tel || ""}`,
			},
			{
				label: "Contact Address of Next of Kin",
				value: n2.address,
				fullWidth: true,
			},
		]);
	}

	let page4 = createPageHTML(
		"Bank Details & Next of Kin",
		"Your Bank Account Name should correspond with your CSCS Account Name",
		p3Sections,
		bankPageNum,
		totalDocumentPages,
	);

	// ── Page 5: Questionnaire ─────────────────────────────────────────────────
	const compliancePageNum = 4 + jointPageOffset;

	let p4Sections = compileBlock(
		"Investment on Behalf of Minors (Persons Under 18 Years)",
		[
			{ label: "Is this account for a Minor?", value: formState.is_minor },
			{
				label: "Name of Minor",
				value: includesMinor ? formState.minor?.name : "N/A",
			},
			{
				label: "Date of Birth (dd/mm/yyyy)",
				value: includesMinor ? formState.minor?.dob : "N/A",
			},
			{
				label: "Gender",
				value: includesMinor ? formState.minor?.gender : "N/A",
			},
			{
				label: "Relationship to applicant",
				value: includesMinor ? formState.minor?.relationship : "N/A",
			},
		],
	);

	const politicalArray = [
		{
			label: "1) Have you occupied any Political Position?",
			value: formState.political,
		},
		{
			label: "If Yes, state the most recent political position occupied",
			value:
				formState.political === "Yes" ? formState.political_position : "N/A",
		},
		{
			label: "Date: From",
			value:
				formState.political === "Yes" ? formState.political_date_from : "N/A",
		},
		{
			label: "Date: To",
			value:
				formState.political === "Yes" ? formState.political_date_to : "N/A",
		},
		{
			label:
				"2) Have any of your close relatives / associates occupied a Political Position?",
			value: formState.rel_political,
			fullWidth: true,
		},
	];
	if (formState.rel_political === "Yes") {
		if (formState.rel_political_1?.name) {
			politicalArray.push({
				label: "I) Name",
				value: formState.rel_political_1.name,
			});
			politicalArray.push({
				label: "Relationship",
				value: formState.rel_political_1.relationship,
			});
			politicalArray.push({
				label: "Position Held",
				value: formState.rel_political_1.position,
			});
			politicalArray.push({
				label: "Date: From — To",
				value: `${formState.rel_political_1.date_from} — ${formState.rel_political_1.date_to}`,
			});
		}
		if (formState.rel_political_2?.name) {
			politicalArray.push({
				label: "II) Name",
				value: formState.rel_political_2.name,
			});
			politicalArray.push({
				label: "Relationship",
				value: formState.rel_political_2.relationship,
			});
			politicalArray.push({
				label: "Position Held",
				value: formState.rel_political_2.position,
			});
			politicalArray.push({
				label: "Date: From — To",
				value: `${formState.rel_political_2.date_from} — ${formState.rel_political_2.date_to}`,
			});
		}
	}
	p4Sections += compileBlock("Questionnaire", politicalArray);

	const filteredTickers = Array.isArray(formState.excluded_stocks)
		? formState.excluded_stocks.filter(Boolean).join(", ")
		: "";
	p4Sections += compileBlock("Mandate on Portfolio", [
		{
			label:
				"3) Are there any particular stocks which you wish to be excluded from your portfolio?",
			value: formState.exclude_stocks,
			fullWidth: true,
		},
		{
			label: "If yes, state the stocks",
			value:
				formState.exclude_stocks === "Yes" ? filteredTickers || "None" : "N/A",
			fullWidth: true,
		},
		{
			label: "Portfolio Mandate",
			value: formState.portfolio_mandate,
			fullWidth: true,
		},
	]);

	p4Sections += `<div class="pdf-section">
    <div class="pdf-section-title">NSL Client Account Details</div>
    <div class="nsl-acct-block">
      <div class="nsl-acct-row">
        <span class="nsl-acct-label">Account Name</span>
        <span class="nsl-acct-value">NIGERIAN STOCKBROKERS LIMITED-CLIENTS ACCOUNT</span>
      </div>
      <div class="nsl-acct-row">
        <span class="nsl-acct-label">Account Number</span>
        <span class="nsl-acct-value">1000012745</span>
      </div>
      <div class="nsl-acct-row">
        <span class="nsl-acct-label">Bank</span>
        <span class="nsl-acct-value">GLOBUS BANK</span>
      </div>
    </div>
  </div>`;

	let page5 = createPageHTML(
		"Questionnaire",
		"Minor Account, Political Positions & Portfolio Mandate",
		p4Sections,
		compliancePageNum,
		totalDocumentPages,
	);

	// ── Page 6: Attestation & Documents ──────────────────────────────────────
	const executionPageNum = 5 + jointPageOffset;
	let p5Sections = compileBlock("Attestation", [
		{
			label: "Valid Means of ID",
			value: formState.doc_id_uploaded ? "Uploaded" : "Pending",
		},
		{
			label: "Proof of Address (e.g. copy of recent utility bill)",
			value: formState.doc_addr_uploaded ? "Uploaded" : "Pending",
		},
		{
			label: "I (We) attest that all information provided herein is accurate",
			value: formState.attested ? "Agreed" : "Not Signed",
		},
		{ label: "Name of Account Holder", value: formState.sign_name },
		{ label: "Date", value: formState.sign_date },
		{
			label: "Name of Joint Account Holder",
			value: includesJoint ? formState.joint_sign_name : "N/A",
		},
	]);

	// Document gallery
	const assetMap = [
		{ data: formState.passport_photo, tag: "Passport Photograph" },
		{ data: formState.signature, tag: "Signature of Account Holder" },
		{ data: formState.id_doc, tag: "Valid Means of ID" },
		{ data: formState.utility_bill, tag: "Proof of Address" },
		{
			data: formState.joint?.passport_photo,
			tag: "Joint Holder — Passport Photograph",
		},
		{
			data: formState.joint?.signature,
			tag: "Signature of Joint Account Holder",
		},
		{ data: formState.joint?.id_doc, tag: "Joint Holder — Valid Means of ID" },
		{
			data: formState.joint?.utility_bill,
			tag: "Joint Holder — Proof of Address",
		},
		{
			data: formState.nok1?.passport_photo,
			tag: "First Next of Kin — Passport Photograph",
		},
		{
			data: formState.nok1?.id_doc,
			tag: "First Next of Kin — Valid Means of ID",
		},
		{
			data: formState.nok2?.passport_photo,
			tag: "Second Next of Kin — Passport Photograph",
		},
		{
			data: formState.nok2?.id_doc,
			tag: "Second Next of Kin — Valid Means of ID",
		},
		{
			data: formState.minor?.passport_photo,
			tag: "Minor — Passport Photograph",
		},
		{
			data: formState.minor?.birth_certificate,
			tag: "Minor — Birth Certificate",
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
			galleryHTML += `<div class="pdf-img-box">
        <span>${asset.tag}</span>
        <img src="${asset.data}" alt="${asset.tag}" />
      </div>`;
		}
		assetCount++;
	}

	if (assetCount > 0) {
		p5Sections += `<div class="pdf-section">
      <div class="pdf-section-title">Uploaded Documents</div>
      <div class="pdf-gallery">${galleryHTML}</div>
    </div>`;
	}

	let page6 = createPageHTML(
		"Attestation & Documents",
		"Memorandum of Acceptance & Document Checklist",
		p5Sections,
		executionPageNum,
		totalDocumentPages,
	);

	// ═══════════════════════════════════════════════════════════════════════════
	// NEW STATIC PAGES
	// ═══════════════════════════════════════════════════════════════════════════
	const staticBase = 6 + jointPageOffset;

	// ── Static Page 1: Terms & Conditions ────────────────────────────────────
	const tcHTML = `
    <div class="static-section">
      <div class="static-section-title">Terms &amp; Conditions</div>
      <ol class="static-list">
        <li>Nigerian Stockbrokers Limited's (NSL) offices are open for business between the hours of 8 a.m. and 5 p.m. on each day that is designated a business day in Nigeria ("business day") except Public Holidays.</li>
        <li>The preferred channel for receiving clients mandates is physical presence of the client or through the on-line brokerage account which can be accessed via <strong>www.nslng.com</strong>. Mandates can also be sent to the dedicated email address for mandates via <strong>nslmandates@nslng.com</strong>.</li>
        <li>The deadline for the receipt of clients' mandates via all channels is 8 a.m. (Nigerian time) on the prescribed business day of execution.</li>
        <li>In the absence of an express instruction as to a specific timeline for the expiration of clients' mandates, the mandate will be valid for a maximum of 60 days except cancelled.</li>
        <li>Amendments/cancellation of mandates can be done via either the online brokerage account or via e-mail to nslmandates@nslng.com. This is also subject to the deadline in (3) above.</li>
        <li>Where mandates/amendments/cancellations are submitted after the deadline stated in (3) above, the mandates/amendments/cancellations may not be treated until the next business day.</li>
        <li>Mandates / amendments / cancellation received on a day that is not a business day will be deemed to have been received on the business day immediately following the day of actual receipt.</li>
        <li>Where a mandate consists of a purchase instruction, it can only be treated if sufficient funds are available in the client's Stockbroking Account to execute such instruction(s).</li>
        <li>Where a purchase mandate is dependent on the sale proceeds of stocks, the purchase mandate may not be executed until the sale transaction had been executed. The sale mandate will be executed even if the stocks to purchase are not available.</li>
        <li>A client's mandate will be executed strictly by NSL in line with the client's instruction and shall not be deemed to have been influenced by the opinion or advice of the Stockbrokers.</li>
        <li>NSL executes transactions based on the ruling market prices of stocks on the floor of The Nigerian Stock Exchange at the time of execution.</li>
        <li>NSL executes mandates on a best efforts basis only. It is therefore unable to guarantee that a mandate will be executed on a particular day even where such mandate indicates that the relevant transaction is to be effected at "market price" on that day.</li>
        <li>Buy and sell mandates can only indicate one price and not a price range. A client will be advised of the outcome of his/her mandate via e-mail. Where this is not received by close of business on the next working day after the mandate was submitted, the client shall be expected to contact NSL.</li>
        <li>All sale proceeds shall be retained in the client's Stockbroking Account except otherwise advised in writing by the client.</li>
        <li>Funds deposited into client's Stockbroking Account with NSL including retained proceeds of sales is not interest bearing. A client's funds will remain in the client's Stockbroking Account pending further instructions from the client.</li>
        <li>Payments will be made to clients promptly upon receipt of instruction from the clients.</li>
        <li>Requests to withdraw funds from client's Stockbroking Account will only be honoured if there are adequate cleared and unencumbered funds in the client's Stockbroking account with NSL. Associated transfer charge(s) for interbank transfers will be borne by the client.</li>
        <li>NSL shall not make any payment from a client's Stockbroking Account to a 3rd party even if such payment has been authorized by the account holder.</li>
        <li>NSL has my (our) authority to maintain a minimum credit balance of ₦2,000.00 in my/our Stockbroking Account.</li>
        <li>NSL has my (our) authority to debit my/our Stockbroking Account with Annual Maintenance Fee which is subject to review.</li>
        <li>NSL can be contacted via e-mail: nslmandates@nslng.com or info@nslng.com, telephone: +234-1-2715754, 27199581 or 07053002999 (SMS only).</li>
        <li>NSL shall not be held responsible for any breach(es) in respect of transaction(s) conducted by Clients online. The client holds NSL harmless and without any liability in respect of such breach(es).</li>
        <li>I (We) have carefully read the conditions stated above with regard to my (our) transactions with NSL and concede to all the terms and conditions.</li>
      </ol>
    </div>
    <div class="static-section">
      <div class="static-section-title">Signature</div>
      <div class="sign-row">
        <div class="sign-block">
          <div class="sign-label">Signature / Thumbprint of Applicant</div>
          <div class="sign-line"></div>
        </div>
        <div class="sign-block">
          <div class="sign-label">Date</div>
          <div class="sign-line"></div>
        </div>
      </div>
    </div>`;

	const pageTC = createStaticPageHTML(
		"Terms &amp; Conditions",
		"Please read carefully before signing",
		tcHTML,
		staticBase,
		totalDocumentPages,
	);

	// ── Static Page 2: Complaints Management Policy ───────────────────────────
	const complaintsHTML = `
    <div class="static-section">
      <div class="static-section-title">Complaints Management Policy</div>
      <p class="static-para">This policy implements the Securities &amp; Exchange Commission's Directive on Complaints Management Systems. The Complaints Management Framework of the Nigeria Capital Market shall address complaints arising out of issues that are covered under the Investments and Securities Act, 2007 (ISA), the Rules and Regulations made pursuant to the ISA, the rules and regulations of Securities and Exchange Commission (SEC) and guidelines of recognized trade associations.</p>
      <p class="static-para">All Capital market participants must implement an effective complaints management system.</p>
      <p class="static-para">NSL's Complaint Management Policy and Procedures have been developed under this directive. This policy sets the direction for Client's Complaint Management in NSL. The Client's Complaint Management Procedures set out the steps to be adopted by Clients who have complaints.</p>
      <p class="static-para"><strong>The purpose of this Policy is to:</strong></p>
      <ol class="static-list alpha">
        <li>Provide an avenue for customer communication and feedback;</li>
        <li>Recognise, promote and protect the customer's rights, including the right to comment and provide feedback on service;</li>
        <li>Provide an efficient, fair and accessible framework for resolving customer complaints and monitoring feedback to improve service delivery;</li>
        <li>Inform customers on the customer complaint handling processes; and</li>
        <li>Provide staff with information about the customer feedback process.</li>
      </ol>
      <p class="static-para"><strong>For the purpose of this Policy, a complaint is:</strong></p>
      <ol class="static-list">
        <li>Any expression of dissatisfaction or concern made by, or on behalf of a client, that relates to the Company's products or services, or the performance, behaviour and conduct of staff, or the complaints handling process itself.</li>
        <li>A complaint may be made in person, by phone, email or in writing.</li>
      </ol>
      <p class="static-para">The Complaints Management Policy details the major components of the management of feedbacks. The components include the receipt, management and determination of all customer feedbacks.</p>
      <p class="static-para"><strong>NSL customer complaint policy is based on the following principles:</strong></p>
      <ol class="static-list alpha">
        <li>Clients will be encouraged to voice their concerns at the point of service as soon as they feel dissatisfied. Wherever possible, the complaints will be resolved at the point from which they originate without delay.</li>
        <li>If clients are not satisfied with the explanations, they can write or call the company's <strong>Customer Complaint Unit</strong> (on +234-1-2715754) so that the complaints will be dealt with quickly.</li>
        <li>For written complaint(s), the Company will acknowledge receipt of complaints received by email within three (3) working days. Where complaints are received by post, the Company shall respond in writing within five (5) working days of the receipt of the complaint.</li>
        <li>Clients are at liberty to call or write to the Chairman, Association of Stockbroking Houses of Nigeria (ASHON) if not satisfied with the resolution provided by the Company.</li>
      </ol>
      <p class="static-para">Each complainant will be addressed in an equitable, objective and unbiased manner through the complaints handling process.</p>
      <p class="static-para">The Code of Ethics of the Company requires all employees to comply with the minimum standards of conduct and integrity based around the principles of personal integrity, relationships with others, and accountability.</p>
      <p class="static-para">Where a customer raises a complaint, they have the right to have that complaint:</p>
      <ol class="static-list">
        <li>Received and addressed in strict confidence;</li>
        <li>Addressed in a spirit of helpful co-operation and sensitivity; and</li>
        <li>Resolved as promptly as possible.</li>
      </ol>
      <p class="static-para">To assist in achieving this, complaints will be kept separate from other records and information that would identify complainants will not be released in individual or aggregated form to anyone not involved in the customer complaint procedure without prior written permission from the Managing Director.</p>
      <p class="static-para">The Complaints Management Policy is designed to identify opportunities for improving customer satisfaction with the delivery of products and services and enhance the customer/provider relationship. However, it is recognised that complainants will sometimes name individual staff. Staff have the right to appropriate feedback and communication on work performance, fair and consistent treatment and reasonable avenues of redress. These rights are to be respected at all times, particularly in complaints where staff are cited.</p>
    </div>`;

	const pageComplaints = createStaticPageHTML(
		"Complaints Management Policy",
		"SEC Directive on Complaints Management Systems",
		complaintsHTML,
		staticBase + 1,
		totalDocumentPages,
	);

	// ── Static Page 3a: Indemnification (Part 1) ─────────────────────────────
	const indemnHTML1 = `
    <div class="static-section">
      <div class="static-section-title">Indemnification</div>
      <p class="static-para">In consideration of NSL (and its owners, suppliers, consultants, advertisers, affiliates, partners, employees or any other associated entities, all collectively referred to as 'associated entities' hereafter) acting on my mandates given via email, written letter and all other electronic channels/platforms regarding my stock broking account with NSL (the "Services"), I/We hereby confirm that:</p>
      <p class="static-para"><strong>1. Terms of Use</strong></p>
      <p class="static-para">1.1. By signing this form (the "Agreement"), I/We agree to be bound by the following terms and conditions. NSL may change these terms and conditions at anytime. My/Our continued use of NSL means that I/We accept any new or modified terms and conditions that NSL may come up with from time to time.</p>
      <p class="static-para">1.2. The term 'NSL' shall where the context permits include its owners, employees, subsidiaries, affiliates and authorized representatives.</p>
      <p class="static-para">1.3. It is my/our responsibility to keep my/our profile details, including but not limited to, my/our username, passwords and other electronic channel details, private and confidential in order to prevent unauthorized access to my/our account with NSL.</p>
      <p class="static-para">1.4. I/We shall promptly notify NSL of any suspicious or compromising email, message or notification regarding my/our account before taking any action in respect of that notification. Any transaction executed on my/our account before NSL is notified of such compromise will be binding on me/us.</p>
      <p class="static-para">1.5. NSL is authorized by me/us to act on my/our mandates, transmitted via any of the referenced electronic channels/platforms registered under my/our name and recorded with NSL, without bearing my/our signature or handwriting; and NSL is under no obligation to verify the identity of the individual sending the mandate or the origin of the mandate in my/our name, so that any transaction made pursuant to the mandate shall be binding upon me/us.</p>
      <p class="static-para">1.6. I am/We are bound by every mandate sent via any of the referenced electronic channels which have been acted upon by NSL, whether or not a subsequent mandate issued by me/us to revoke the previous one which has been received by NSL.</p>
      <p class="static-para">1.7. It is my/our responsibility to confirm that a mandate sent by me/us (through SMS or email platform) has been successfully submitted on the NSL database and has been reflected on account.</p>
      <p class="static-para"><strong>2. Registration</strong></p>
      <p class="static-para">2.1. My/Our registration with NSL certifies that all information I/we provide, now or in the future, is accurate. NSL reserves the rights, in its sole discretion, to deny my/our access to this website or any portion thereof without notice.</p>
      <p class="static-para"><strong>3. Proprietary Rights to Content</strong></p>
      <p class="static-para">3.1. I/We acknowledge that the content, service and software (including but not limited to texts, sounds, photographs, graphics or other materials contained in any communication, sponsored advertisements or messages, whether by its owners, its advertisers, subsidiaries, affiliates or partners) of NSL are protected by copyrights, trademarks, service marks, patents and/or other proprietary rights and laws; therefore, I am/We are only permitted to use content, service or software as expressly authorized by NSL, its advertisers, subsidiaries, affiliates and partners.</p>
    </div>`;

	const pageIndemn1 = createStaticPageHTML(
		"Indemnification (Part 1 of 2)",
		"Terms of Use &amp; Proprietary Rights",
		indemnHTML1,
		staticBase + 2,
		totalDocumentPages,
	);

	// ── Static Page 3b: Indemnification (Part 2) ─────────────────────────────
	const indemnHTML2 = `
    <div class="static-section">
      <div class="static-section-title">Indemnification (continued)</div>
      <p class="static-para"><strong>4. Liability Disclaimer</strong></p>
      <p class="static-para">4.1. The use of electronic channels to make use of the Services offered under this Agreement, is at my/our sole risk.</p>
      <p class="static-para">4.2. NSL expressly disclaims any and all express and implied warranties/assurances, including, but not limited to, the implied warranties of merchantability, fitness for a particular purpose and non-infringement. NSL shall not be liable or responsible for those guarantees, warranties/assurances and representations, if any, offered by NSL's advertisers, partners, manufacturers of merchandise or suppliers of its Services. No advice or information, whether oral or written, obtained by myself/us from NSL or through any other source shall create a warranty not expressly made herein.</p>
      <p class="static-para">4.3. The contents, information, software, products, features and other services by NSL may include inaccuracies or typographical errors. NSL may make improvements and/or changes from time to time to correct these inaccuracies or errors. NSL services may be temporarily unavailable from time to time due to required maintenance, telecommunications interruptions, down time or other disruptions beyond its control. NSL shall not be liable to any user or member or any third party in offering the Services. NSL can/may exercise its right to modify or discontinue any or all of the Services at any time and for any reason, as long as it is in its best interest to do so.</p>
      <p class="static-para"><strong>5. Indemnification</strong></p>
      <p class="static-para">I/We agree to indemnify and hold NSL and its associated entities/subsidiaries harmless from any claim, demand, expense or damage, including legal fees by reason of honouring such mandates via email, or other Electronic Channels/Platforms.</p>
      <p class="static-para"><strong>6. Modification of Terms and Conditions</strong></p>
      <p class="static-para">NSL reserves the right to change this Agreement, and/or any part thereof, at anytime. My/Our continued use of NSL to send mandates in respect of my/our account constitutes an affirmative acknowledgment of the amended NSL Terms of Use and Conditions to abide and be bound by any terms thereof. NSL reserves the right to modify or discontinue the services provided by NSL through this Agreement with or without notice to me/us. NSL shall not be liable to me/us or any third party for exercising its right to modify or discontinue the Services.</p>
      <p class="static-para"><strong>7. Notices</strong></p>
      <p class="static-para">All notices given by NSL may be communicated to me either by e-mail, letter or similar electronic channels/platforms and same shall be deemed to have been delivered and duly received by me/us.</p>
      <p class="static-para"><strong>8. Governing Law</strong></p>
      <p class="static-para">This Agreement shall be governed by the laws of the Federal Republic of Nigeria.</p>
    </div>`;

	const pageIndemn2 = createStaticPageHTML(
		"Indemnification (Part 2 of 2)",
		"Liability Disclaimer, Indemnification &amp; Governing Law",
		indemnHTML2,
		staticBase + 3,
		totalDocumentPages,
	);

	// ── Static Page 4: Memorandum of Acceptance ───────────────────────────────
	const memoHTML = `
    <div class="static-section">
      <div class="static-section-title">Memorandum of Acceptance</div>
      <p class="static-para">I/We hereby agree to be bound by the terms and conditions and Indemnity stated herein</p>
      <div class="sign-row" style="margin-top:16px;">
        <div class="sign-block-wide">
          <div class="sign-label">Dated this</div>
          <div class="sign-line"></div>
        </div>
        <div class="sign-block-narrow">
          <div class="sign-label">Day of</div>
          <div class="sign-line"></div>
        </div>
        <div class="sign-block-narrow">
          <div class="sign-label">20</div>
          <div class="sign-line"></div>
        </div>
      </div>
      <div class="memo-row">
        <div class="memo-field">
          <div class="sign-label">Name of Account Holder</div>
          <div class="sign-line"></div>
        </div>
      </div>
      <div class="memo-row">
        <div class="memo-field">
          <div class="sign-label">Signature of Account Holder</div>
          <div class="sign-line"></div>
        </div>
      </div>
      <div class="memo-row">
        <div class="memo-field">
          <div class="sign-label">Name of Joint Account Holder</div>
          <div class="sign-line"></div>
        </div>
      </div>
      <div class="memo-row">
        <div class="memo-field">
          <div class="sign-label">Signature of Joint Account Holder</div>
          <div class="sign-line"></div>
        </div>
      </div>
    </div>`;

	const pageMemo = createStaticPageHTML(
		"Memorandum of Acceptance",
		"Agreement to Terms, Conditions &amp; Indemnity",
		memoHTML,
		staticBase + 4,
		totalDocumentPages,
	);

	// ── Static Page 5: Anti-Money Laundering & Risk Management ───────────────
	const amlHTML = `
    <div class="static-section">
      <div class="static-section-title">Anti-Money Laundering and Risk Management</div>

      <p class="static-para aml-question"><strong>1. Is the customer's core business activity one of the defined "High Risk Business" and if so, which?</strong></p>
      <div class="aml-options">
        <div class="aml-opt-row">
          <span class="aml-checkbox"></span><span class="aml-opt-label">No</span>
        </div>
        <div class="aml-opt-row">
          <span class="aml-checkbox"></span>
          <span class="aml-opt-label">Yes. Management concurs with the "High Risk" assessment and opening account subject to High Risk Management Monitoring</span>
        </div>
        <div class="aml-opt-row">
          <span class="aml-checkbox"></span>
          <span class="aml-opt-label">Yes, Management judgementally assesses as "Low Risk" (provide justification below)</span>
        </div>
      </div>
      <div class="aml-write-area">
        <div class="sign-label">Justification (if applicable)</div>
        <div class="aml-writebox"></div>
      </div>

      <p class="static-para aml-question" style="margin-top:8px;"><strong>2. Is the customer located in a "High Risk" geography and/or does the customer deal primarily with customers or suppliers who are located in such geographies?</strong></p>
      <div class="aml-options">
        <div class="aml-opt-row">
          <span class="aml-checkbox"></span><span class="aml-opt-label">No</span>
        </div>
        <div class="aml-opt-row">
          <span class="aml-checkbox"></span>
          <span class="aml-opt-label">Yes. List which country(s): <span class="aml-underline"></span></span>
        </div>
      </div>

      <div class="aml-classification" style="margin-top:8px;">
        <strong>Classification:</strong>
        <span class="aml-class-item"><span class="aml-checkbox"></span> High Risk</span>
        <span class="aml-class-item"><span class="aml-checkbox"></span> Low Risk</span>
        <span class="aml-class-item"><span class="aml-checkbox"></span> Compliance</span>
      </div>

      <div class="sign-row" style="margin-top:10px;">
        <div class="sign-block">
          <div class="sign-label">Completed by Risk Manager (Sign)</div>
          <div class="sign-line"></div>
        </div>
        <div class="sign-block">
          <div class="sign-label">Date</div>
          <div class="sign-line"></div>
        </div>
      </div>
    </div>

    <div class="static-section" style="margin-top:6px;">
      <div class="static-section-title">Visitation Report</div>
      <div class="visit-grid">
        <div class="visit-field full">
          <div class="sign-label">Customer Name</div>
          <div class="visit-cells"><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div></div>
        </div>
        <div class="visit-field full">
          <div class="sign-label">Nature of Business / Occupation</div>
          <div class="visit-cells"><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div></div>
        </div>
        <div class="visit-field full">
          <div class="sign-label">Residential Address (Not Postal Address)</div>
          <div class="visit-cells"><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div></div>
        </div>
        <div class="visit-field full">
          <div class="sign-label">Met with (Name &amp; Designation)</div>
          <div class="visit-cells"><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div></div>
        </div>
        <div class="visit-field full">
          <div class="sign-label">Remark</div>
          <div class="visit-cells"><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div></div>
        </div>
        <div class="visit-field full">
          <div class="sign-label">Visitation Officer's Name / Signature &amp; Date Visited</div>
          <div class="visit-cells"><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div><div class="vcell"></div></div>
        </div>
      </div>
    </div>`;

	const pageAML = createStaticPageHTML(
		"Anti-Money Laundering",
		"AML &amp; Risk Management Assessment",
		amlHTML,
		staticBase + 5,
		totalDocumentPages,
	);

	// ── Static Page 6: For Official Use Only ─────────────────────────────────
	const officialHTML = `
    <div class="static-section">
      <div class="static-section-title">Document Checklist</div>
      <table class="official-table">
        <thead>
          <tr>
            <th>Document</th>
            <th class="tc">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>1) Completed Account Opening Form</td><td class="tc"><span class="off-checkbox"></span></td></tr>
          <tr><td>2) Signed Standard Terms &amp; Conditions</td><td class="tc"><span class="off-checkbox"></span></td></tr>
          <tr><td>3) Passport Photograph</td><td class="tc"><span class="off-checkbox"></span></td></tr>
          <tr><td>4) *Valid Means of ID &nbsp;<em>(* Originals must be sighted)</em></td><td class="tc"><span class="off-checkbox"></span></td></tr>
          <tr><td>5) *Proof of address (e.g. copy of recent utility bill)</td><td class="tc"><span class="off-checkbox"></span></td></tr>
          <tr><td>6) Residence Permit (for Non-Nigerians)</td><td class="tc"><span class="off-checkbox"></span></td></tr>
          <tr><td>7) *Birth Certificate (for Minors)</td><td class="tc"><span class="off-checkbox"></span></td></tr>
          <tr><td>8) Search / Safe Watch List Report (Corporate)</td><td class="tc"><span class="off-checkbox"></span></td></tr>
        </tbody>
      </table>
      <div class="doc-status-row">
        <strong>Document Status:</strong>
        <span class="off-checkbox"></span> Completed &nbsp;&nbsp;
        <span class="off-checkbox"></span> Uncompleted
      </div>
    </div>

    <div class="static-section" style="margin-top:6px;">
      <div class="static-section-title">Account Opening Type</div>
      <div class="opening-type-grid">
        <div class="opening-type-block">
          <div class="opening-type-header">Opening New Account</div>
          <div class="opening-type-row">
            <span class="off-checkbox"></span>
            <div>
              <strong>a. With Funds</strong>
              <div class="opening-inline">
                <span class="sign-label">Amount of Deposit</span>
                <span class="off-line"></span>
              </div>
            </div>
          </div>
          <div class="opening-type-row">
            <span class="off-checkbox"></span>
            <div>
              <strong>b. With Share Certificate(s)</strong>
              <div class="opening-inline">
                <span class="sign-label">Value of Shares</span>
                <span class="off-line"></span>
              </div>
            </div>
          </div>
        </div>
        <div class="opening-type-block">
          <div class="opening-type-header">For Incoming Transfer of Shares</div>
          <div class="opening-inline">
            <span class="sign-label">CS CS A/C No.</span>
            <span class="off-line"></span>
          </div>
          <div class="opening-inline">
            <span class="sign-label">Resident House</span>
            <span class="off-line"></span>
          </div>
          <div class="opening-inline">
            <span class="sign-label">Value of Shares</span>
            <span class="off-line"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="static-section" style="margin-top:6px;">
      <div class="static-section-title">For Official Use Only</div>
      <div class="official-sign-grid">
        <div class="official-sign-row">
          <div class="official-sign-col">
            <div class="sign-label">Account Opening Initiated By: Name</div>
            <div class="sign-line"></div>
          </div>
          <div class="official-sign-col">
            <div class="sign-label">Signature &amp; Date</div>
            <div class="sign-line"></div>
          </div>
        </div>
        <div class="official-sign-row">
          <div class="official-sign-col">
            <div class="sign-label">Documentation Checked By: Name</div>
            <div class="sign-line"></div>
          </div>
          <div class="official-sign-col">
            <div class="sign-label">Signature &amp; Date</div>
            <div class="sign-line"></div>
          </div>
        </div>
        <div class="official-sign-row">
          <div class="official-sign-col" style="grid-column: 1 / -1;">
            <div class="sign-label" style="font-weight:700; color:#8b1a1a; margin-bottom:6px;">Account Opening Authorised By:</div>
          </div>
        </div>
        <div class="official-sign-row">
          <div class="official-sign-col">
            <div class="sign-label">Head, Compliance: Name</div>
            <div class="sign-line"></div>
          </div>
          <div class="official-sign-col">
            <div class="sign-label">Signature &amp; Date</div>
            <div class="sign-line"></div>
          </div>
        </div>
        <div class="official-sign-row">
          <div class="official-sign-col" style="grid-column: 1 / -1;">
            <div class="sign-label" style="font-weight:700; color:#8b1a1a; margin-bottom:6px;">Account Opening Approved By:</div>
          </div>
        </div>
        <div class="official-sign-row">
          <div class="official-sign-col">
            <div class="sign-label">Managing Director</div>
            <div class="sign-line"></div>
          </div>
          <div class="official-sign-col">
            <div class="sign-label">Signature &amp; Date</div>
            <div class="sign-line"></div>
          </div>
        </div>
        <div class="official-sign-row">
          <div class="official-sign-col">
            <div class="sign-label">CSCS Number</div>
            <div class="sign-line"></div>
          </div>
          <div class="official-sign-col">
            <div class="sign-label">Account Number</div>
            <div class="sign-line"></div>
          </div>
        </div>
      </div>
    </div>`;

	const pageOfficial = createStaticPageHTML(
		"For Official Use Only",
		"Document Checklist &amp; Account Authorization",
		officialHTML,
		staticBase + 6,
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
      margin-bottom: 6px;
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

    /* NSL account details block */
    .nsl-acct-block {
      padding: 8px 12px 10px;
      background: #faf9f7;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .nsl-acct-row {
      display: flex;
      align-items: baseline;
      gap: 10px;
      font-size: 11px;
    }
    .nsl-acct-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #7a7068;
      font-weight: 700;
      letter-spacing: 0.3px;
      min-width: 110px;
      flex-shrink: 0;
    }
    .nsl-acct-value {
      font-size: 12px;
      color: #1c1814;
      font-weight: 700;
    }

    /* ── Static page styles ──────────────────────────────────────────── */
    .pdf-static-body {
      flex: 1;
      overflow: hidden;
    }
    .static-section {
      margin-bottom: 6px;
      border: 1px solid #e2ddd6;
      border-radius: 6px;
      overflow: hidden;
      break-inside: avoid;
    }
    .static-section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #ffffff;
      background: #8b1a1a;
      padding: 5px 12px;
      font-weight: 700;
    }
    .static-para {
      font-size: 10.5px;
      line-height: 1.5;
      color: #1c1814;
      padding: 0 12px;
      margin-top: 5px;
    }
    .static-para:last-of-type { padding-bottom: 8px; }
    .static-list {
      font-size: 10.5px;
      line-height: 1.5;
      color: #1c1814;
      padding: 4px 12px 8px 30px;
    }
    .static-list li { margin-bottom: 3px; }
    .static-list.alpha { list-style-type: lower-alpha; }

    /* Signature rows */
    .sign-row {
      display: flex;
      gap: 20px;
      padding: 10px 12px 14px;
      background: #faf9f7;
    }
    .sign-block { flex: 1; }
    .sign-block-wide { flex: 2; }
    .sign-block-narrow { flex: 1; }
    .sign-label {
      font-size: 9px;
      text-transform: uppercase;
      color: #7a7068;
      font-weight: 700;
      letter-spacing: 0.3px;
      margin-bottom: 20px;
      display: block;
    }
    .sign-line {
      border-bottom: 1px solid #1c1814;
      height: 22px;
    }
    .memo-row {
      padding: 6px 12px;
      background: #faf9f7;
    }
    .memo-field { margin-bottom: 14px; }

    /* AML */
    .aml-options { padding: 6px 12px 0; background: #faf9f7; }
    .aml-opt-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      margin-bottom: 6px;
      font-size: 10.5px;
    }
    .aml-checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1.5px solid #8b1a1a;
      border-radius: 2px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .aml-opt-label { line-height: 1.45; color: #1c1814; }
    .aml-write-area { padding: 6px 12px 10px; background: #faf9f7; }
    .aml-writebox {
      border: 1px solid #c8b8a8;
      border-radius: 3px;
      height: 36px;
      background: #fff;
      margin-top: 6px;
    }
    .aml-classification {
      padding: 0 12px 10px;
      background: #faf9f7;
      font-size: 10.5px;
      display: flex;
      align-items: center;
      gap: 18px;
    }
    .aml-class-item {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .aml-underline {
      display: inline-block;
      border-bottom: 1px solid #1c1814;
      width: 100px;
      height: 14px;
      vertical-align: bottom;
    }
    .aml-question { padding: 8px 12px 4px; background: #faf9f7; }

    /* Visitation cells */
    .visit-grid { padding: 10px 12px 12px; background: #faf9f7; }
    .visit-field { margin-bottom: 10px; }
    .visit-cells {
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      margin-top: 5px;
    }
    .vcell {
      width: 18px;
      height: 18px;
      border: 1px solid #c8b8a8;
      border-radius: 2px;
      background: #fff;
    }

    /* Official use table */
    .official-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
      background: #faf9f7;
      margin: 0;
    }
    .official-table th {
      background: #f0ede9;
      color: #4a4238;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      padding: 5px 10px;
      border-bottom: 1px solid #e2ddd6;
      text-align: left;
    }
    .official-table th.tc, .official-table td.tc { text-align: center; }
    .official-table td {
      padding: 5px 10px;
      border-bottom: 1px solid #f0ede9;
      color: #1c1814;
    }
    .official-table tr:last-child td { border-bottom: none; }
    .off-checkbox {
      display: inline-block;
      width: 13px;
      height: 13px;
      border: 1.5px solid #8b1a1a;
      border-radius: 2px;
      vertical-align: middle;
    }
    .doc-status-row {
      padding: 8px 12px;
      font-size: 10.5px;
      background: #faf9f7;
      display: flex;
      align-items: center;
      gap: 10px;
      border-top: 1px solid #e2ddd6;
    }

    /* Opening type */
    .opening-type-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 10px 12px 12px;
      background: #faf9f7;
    }
    .opening-type-block { }
    .opening-type-header {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #8b1a1a;
      border-bottom: 1px solid #e2ddd6;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .opening-type-row {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      margin-bottom: 8px;
      font-size: 10.5px;
    }
    .opening-inline {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-size: 10px;
    }
    .off-line {
      flex: 1;
      display: inline-block;
      border-bottom: 1px solid #1c1814;
      height: 14px;
      min-width: 60px;
    }

    /* Official sign grid */
    .official-sign-grid {
      padding: 10px 12px 14px;
      background: #faf9f7;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .official-sign-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .official-sign-col { }
  </style>
</head>
<body>
  ${page1}
  ${page2}
  ${page3}
  ${page4}
  ${page5}
  ${page6}
  ${pageTC}
  ${pageComplaints}
  ${pageIndemn1}
  ${pageIndemn2}
  ${pageMemo}
  ${pageAML}
  ${pageOfficial}
</body>
</html>`;
}

async function renderPDF(html) {
	const isProduction = process.env.NODE_ENV === "production";

	const browser = await puppeteer.launch({
		executablePath: isProduction
			? "/usr/bin/google-chrome-stable"
			: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
		headless: "new",
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-dev-shm-usage",
			"--disable-gpu",
		],
	});

	try {
		const page = await browser.newPage();

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
