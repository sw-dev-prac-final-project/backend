const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendConfirmationEmail = async (userEmail, userName, booking, company) => {
    const mailOptions = {
        from: '"Interview Team" <your-email@gmail.com>',
        to: userEmail,
        subject: "Interview Booking Confirmation",
        html: `
            <p>Dear ${userName},</p>
            <p>Your interview has been successfully booked with <strong>${company.name}</strong>.</p>
            <ul>
                <li><strong>Date:</strong> ${booking.apptDate}, ${booking.timeSlot}</li>
                <li><strong>Location:</strong> ${company.address}</li>
                <li><strong>Contact:</strong> ${company.tel}</li>
                <li><strong>Website:</strong> <a href="${company.website}">${company.website}</a></li>
            </ul>
            <p>Please ensure you arrive on time. If you need to reschedule, contact us at maskymon@gmail.com.</p>
            <p>Best regards,</p>
            <p>The Interview Team</p>
        `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Confirmation email sent:", info.response);
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = sendConfirmationEmail;
