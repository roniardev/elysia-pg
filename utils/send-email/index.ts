import { Resend } from "resend";
import { config } from "@/app/config";

const resend = new Resend(config.RESEND_API_KEY);

export const sendEmail = async (to: string, subject: string, html: string) => {
	const { data, error } = await resend.emails.send({
		from: config.RESEND_FROM_EMAIL,
		to,
		subject,
		html,
	});

	if (error) {
		throw new Error(error.message);
	}

	return data;
};
