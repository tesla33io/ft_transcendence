import nodemailer from 'nodemailer';

export class EmailService {
    private static transporter: nodemailer.Transporter | null = null;

    private static getTransporter(): nodemailer.Transporter {
        if (this.transporter) {
            return this.transporter;
        }

        const smtpUser = process.env.SMTP_USER;
        const smtpPassword = process.env.SMTP_PASSWORD;
        const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
        const smtpPort = parseInt(process.env.SMTP_PORT || '587');

        // Debug logging to verify configuration
        console.log('[EmailService] SMTP Configuration Check:', {
            SMTP_HOST: smtpHost,
            SMTP_PORT: smtpPort,
            SMTP_USER: smtpUser ? `${smtpUser.substring(0, 3)}***` : 'NOT SET',
            SMTP_PASSWORD: smtpPassword ? '***' : 'NOT SET',
            SMTP_FROM: process.env.SMTP_FROM || 'NOT SET'
        });

        if (!smtpUser || !smtpPassword) {
            throw new Error(
                'SMTP credentials not configured. Please set SMTP_USER and SMTP_PASSWORD in .env file. ' +
                `Current values: SMTP_USER=${smtpUser ? 'set' : 'NOT SET'}, SMTP_PASSWORD=${smtpPassword ? 'set' : 'NOT SET'}`
            );
        }

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: false,
            auth: {
                user: smtpUser,
                pass: smtpPassword
            }
        });

        return this.transporter;
    }

    static async send2FACode(email: string, code: string): Promise<void> {
        const transporter = this.getTransporter();
        
        await transporter.sendMail({
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