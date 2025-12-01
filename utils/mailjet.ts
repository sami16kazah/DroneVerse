import Mailjet from "node-mailjet";

const mailjet = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY || "7a0b34b95ad9cf491929f6eb48f2d36e",
  apiSecret: process.env.MAILJET_SECRET_KEY || "65850e6b617bd947172dfdc90f4e5adf",
});

export const sendVerificationEmail = async (toEmail: string, name: string, token: string) => {
  const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/verify?token=${token}`;

  try {
    console.log("Attempting to send email to:", toEmail);
    const request = await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_SENDER_EMAIL || "samkazah444@gmail.com", // Fallback to a likely verified email or ask user
            Name: "DroneVerse",
          },
          To: [
            {
              Email: toEmail,
              Name: name,
            },
          ],
          Subject: "Verify your DroneVerse Account",
          HTMLPart: `
            <h3>Welcome to DroneVerse, ${name}!</h3>
            <p>Please click the link below to verify your account:</p>
            <a href="${verificationLink}">Verify Account</a>
            <br />
            <p>If you did not request this, please ignore this email.</p>
          `,
        },
      ],
    });
    console.log("Email sent successfully:", request.body);
    return request.body;
  } catch (error: any) {
    console.error("Error sending email:", error.statusCode, error.message, error.response?.text);
    throw error;
  }
};
