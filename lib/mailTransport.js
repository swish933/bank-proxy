import nodemailer from "nodemailer";
import logger from "../logger.js";

const mail_host = process.env.EMAIL_HOST;
const mail_port = process.env.EMAIL_PORT;
const mail_username = process.env.EMAIL_USER;
const mail_password = process.env.EMAIL_PASS;

export const transporter = nodemailer.createTransport({
	host: mail_host,
	port: mail_port,
	secure: false,
	auth: {
		user: mail_username,
		pass: mail_password,
	},
});

transporter.verify((error, _) => {
	if (error) {
		logger.error({ err: error }, "Error configuring email transporter");
	} else {
		logger.info("Email transporter is ready to send messages");
	}
});
