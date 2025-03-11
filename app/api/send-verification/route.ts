import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { to, name, uid, events } = await req.json();

        console.log('Received email request for:', { to, name, uid });

        // Create transporter with Gmail credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'svucyno@gmail.com',
                pass: 'ktka pogf kskp jzek'
            }
        });

        // Email content
        const mailOptions = {
            from: '"CYNOSURE 2025" <svucyno@gmail.com>',
            to: to,
            subject: 'Registration Verification Success - CYNOSURE 2025',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">Registration Verified</h1>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; color: #374151;">Dear ${name},</p>
                        
                        <p style="font-size: 16px; color: #374151;">Your registration has been successfully verified for the following events:</p>
                        
                        <ul style="list-style: none; padding: 0;">
                            ${events.map((event: string) => `
                                <li style="background: #EFF6FF; color: #1E40AF; padding: 8px 16px; margin: 8px 0; border-radius: 20px; display: inline-block; margin-right: 8px;">
                                    ${event}
                                </li>
                            `).join('')}
                        </ul>
                        
                        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #374151;">Your Registration ID: <strong>${uid}</strong></p>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151;">Please keep this ID for future reference. You'll need it during the events.</p>
                        
                        <p style="font-size: 16px; color: #374151; margin-top: 20px;">Best regards,<br>CYNOSURE 2025 Team</p>
                    </div>
                </div>
            `
        };

        console.log('Attempting to send email...');

        try {
            // Send the email
            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info);
            return NextResponse.json({ 
                success: true, 
                messageId: info.messageId,
                response: info.response,
                accepted: info.accepted,
                rejected: info.rejected
            });
        } catch (sendError: Error | any) {
            console.error('Error sending email:', sendError);
            return NextResponse.json(
                { 
                    error: 'Failed to send email', 
                    details: sendError.message,
                    code: sendError.code,
                    command: sendError.command
                },
                { status: 500 }
            );
        }
    } catch (error: Error | any) {
        console.error('Request processing error:', error);
        return NextResponse.json(
            { error: 'Failed to process request', details: error.message },
            { status: 500 }
        );
    }
} 