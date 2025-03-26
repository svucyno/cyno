import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { 
            to, 
            name, 
            uid, 
            events, 
            complementaryEvent, 
            teamMembers, 
            isRejected, 
            isPaper, 
            isIdeathon, 
            isHackathon, 
            whatsappLink, 
            whatsappGroupName, 
            teamName, 
            problemStatement 
        } = await req.json();

        console.log('Received email request for:', { 
            to, 
            name, 
            uid, 
            events, 
            complementaryEvent, 
            teamMembers, 
            isRejected, 
            isPaper, 
            isIdeathon, 
            isHackathon, 
            whatsappLink, 
            whatsappGroupName,
            teamName,
            problemStatement
        });

        // Create transporter with Gmail credentials
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'cbhanuprakash1212@gmail.com',
                pass: 'dthl exap ylgm rrnq'
            }
        });

        // Get submission type for email subject
        const submissionType = isPaper ? 'Paper Presentation' : isIdeathon ? 'Ideathon' : isHackathon ? 'Hackathon' : 'Event Registration';

        // Simple and clear subject line
        const subject = isRejected ? 
            `Action Required: ${submissionType} Status Update` : 
            `Confirmed: Your ${submissionType} Registration`;

        // Email content based on verification status
        const mailOptions = {
            from: '"CYNOSURE 2025" cynosvu@gmail.com',
            to: to,
            subject: subject,
            text: isRejected ? 
                `Dear ${name},\n\nYour ${submissionType} submission (ID: ${uid}) requires attention. Please verify your payment details.\n\nContact us at svucyno@gmail.com for support.\n\nBest regards,\nCYNOSURE 2025 Team` 
                : 
                `Dear ${name},\n\nYour ${submissionType} registration (ID: ${uid}) has been verified.\n\nBest regards,\nCYNOSURE 2025 Team`,
            html: isRejected ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333333;">Registration Status Update</h2>
                    <p style="color: #444444;">Dear ${name},</p>
                    <p style="color: #444444;">Your ${submissionType.toLowerCase()} submission requires attention.</p>
                    <p style="color: #444444;">Registration ID: ${uid}</p>
                    <p style="color: #444444;">Please verify:</p>
                    <ul style="color: #444444;">
                        <li>Transaction Reference Number</li>
                        <li>Payment Amount</li>
                    </ul>
                    <p style="color: #444444;">For support:</p>
                    <p style="color: #444444;">Email: svucyno@gmail.com</p>
                    <p style="color: #444444;">WhatsApp Support: <a href="${whatsappLink}" style="color: #2563eb;">${whatsappGroupName}</a></p>
                    <p style="color: #444444;">Best regards,<br>CYNOSURE 2025 Team</p>
                </div>
            ` : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #333333;">Registration Confirmed</h2>
                    <p style="color: #444444;">Dear ${name},</p>
                    <p style="color: #444444;">Your ${submissionType.toLowerCase()} registration has been verified.</p>
                    <p style="color: #444444;">Registration ID: ${uid}</p>
                    ${events ? `
                        <p style="color: #444444;">Events:</p>
                        <p style="color: #444444;">${events.join(', ')}</p>
                    ` : ''}
                    ${complementaryEvent ? `
                        <p style="color: #444444;">Complementary Event: ${complementaryEvent}</p>
                    ` : ''}
                    ${isHackathon ? `
                        <div style="margin-top: 15px;">
                            <p style="color: #444444;">Team: ${teamName || 'Not specified'}</p>
                            <p style="color: #444444;">Problem Statement: ${problemStatement || 'To be announced'}</p>
                            ${teamMembers && teamMembers.length > 0 ? `
                                <p style="color: #444444;">Team Members: ${teamMembers.join(', ')}</p>
                            ` : ''}
                        </div>
                    ` : ''}
                    <p style="color: #444444;">WhatsApp Group: <a href="${whatsappLink}" style="color: #2563eb;">${whatsappGroupName}</a></p>
                    <p style="color: #444444;">Best regards,<br>CYNOSURE 2025 Team</p>
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