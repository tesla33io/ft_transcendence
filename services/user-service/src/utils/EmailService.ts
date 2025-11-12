import nodemailer from 'nodemailer';

export class EmailService {
    private static transporter = nodemailer.createTransport({
        // For development, use Gmail or a service like Mailtrap
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });

    static async send2FACode(email: string, code: string): Promise<void> {
        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@ponggame.com',
            to: email,
            subject: 'Your Pong Game 2FA Code',
            html: `
                <h2>Your Two-Factor Authentication Code</h2>
                <p>Your verification code is: <strong>${code}</strong></p>
                <p>This code will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email.</p>
            `
        });
    }
}