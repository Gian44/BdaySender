import nodemailer from "nodemailer";

function getCredentials() {
  const user = process.env.BDAY_SENDER_GMAIL_ID?.trim();
  const pass = process.env.BDAY_SENDER_GMAIL_APP_PASSWORD?.trim();
  if (!user || !pass) {
    throw new Error(
      "Missing Gmail credentials: set BDAY_SENDER_GMAIL_ID and BDAY_SENDER_GMAIL_APP_PASSWORD",
    );
  }
  return { user, pass };
}

export async function sendBirthdayEmail(to: string, subject: string, text: string): Promise<void> {
  const { user, pass } = getCredentials();

  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transport.sendMail({
    from: user,
    to,
    subject,
    text,
  });
}
