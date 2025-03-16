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
                user: 'svucyno@gmail.com',
                pass: 'ktka pogf kskp jzek'
            }
        });

        // Get submission type for email subject
        const submissionType = isPaper ? 'Paper Presentation' : isIdeathon ? 'Ideathon' : isHackathon ? 'Hackathon' : 'Event Registration';

        // Email content based on verification status
        const mailOptions = {
            from: '"CYNOSURE 2025" <svucyno@gmail.com>',
            to: to,
            subject: isRejected ? `${submissionType} Update - CYNOSURE 2025` : `${submissionType} Verification Success - CYNOSURE 2025`,
            html: isRejected ? `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(to right, #dc2626, #b91c1c); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">${submissionType} Update</h1>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; color: #374151;">Dear ${name},</p>
                        
                        <p style="font-size: 16px; color: #374151;">We regret to inform you that your ${submissionType.toLowerCase()} submission for CYNOSURE 2025 could not be verified at this time.</p>
                        
                        <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #991B1B;">Registration ID: <strong>${uid}</strong></p>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151;">Your submission may have been rejected due to one of the following reasons:</p>
                        <ul style="color: #374151; margin: 15px 0;">
                            <li style="margin-bottom: 8px;">Incorrect UTR (Transaction Reference) Number provided</li>
                            <li style="margin-bottom: 8px;">Transaction amount does not match the registration fee</li>
                        </ul>
                        
                        <div style="background: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #991B1B; font-weight: 500; margin-bottom: 10px;">What should you do next?</p>
                            <p style="color: #374151; margin: 0;">Please verify your UTR number and transaction amount. If you believe there's an error, contact the CYNOSURE team immediately with your payment proof and registration details.</p>
                        </div>

                        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #374151; font-weight: 500; margin-bottom: 10px;">Join our WhatsApp Group for Support:</p>
                            <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" style="height: 20px; width: 20px; vertical-align: middle; margin-right: 8px;">
                                Join ${whatsappGroupName}
                            </a>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #6B7280;">Get quick support and updates in our WhatsApp group.</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151;">Contact us at:</p>
                        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 10px 0;">
                            <p style="margin: 0 0 8px 0;">
                                <a href="mailto:svucyno@gmail.com" style="color: #2563EB; text-decoration: none;">📧 svucyno@gmail.com</a>
                            </p>
                            <p style="margin: 0; font-size: 14px; color: #6B7280;">Please include your Registration ID and payment details in your email.</p>
                        </div>
                        
                        <p style="font-size: 16px; color: #374151; margin-top: 20px;">Best regards,<br>CYNOSURE 2025 Team</p>
                    </div>
                </div>
            ` : `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(to right, #2563eb, #4f46e5); padding: 20px; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; text-align: center;">${submissionType} Verified</h1>
                    </div>
                    
                    <div style="background: white; padding: 20px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <p style="font-size: 16px; color: #374151;">Dear ${name},</p>
                        
                        <p style="font-size: 16px; color: #374151;">Your ${submissionType.toLowerCase()} submission has been successfully verified${events ? ' for the following events:' : '.'}</p>
                        
                        ${events ? `
                            <ul style="list-style: none; padding: 0;">
                                ${events.map((event: string) => `
                                    <li style="background: #EFF6FF; color: #1E40AF; padding: 8px 16px; margin: 8px 0; border-radius: 20px; display: inline-block; margin-right: 8px;">
                                        ${event}
                                    </li>
                                `).join('')}
                            </ul>
                        ` : ''}
                        
                        ${complementaryEvent ? `
                            <p style="font-size: 16px; color: #374151; margin-top: 16px;">Complementary Event:</p>
                            <div style="display: inline-block; background: #F5F3FF; color: #5B21B6; padding: 8px 16px; border-radius: 20px; margin: 8px 0;">
                                ${complementaryEvent}
                            </div>
                        ` : ''}
                        
                        ${isIdeathon && teamMembers && teamMembers.length > 0 ? `
                            <p style="font-size: 16px; color: #374151; margin-top: 16px;">Team Members:</p>
                            <div style="margin: 8px 0;">
                                ${teamMembers.map((member: string) => `
                                    <span style="display: inline-block; background: #F3F4F6; color: #374151; padding: 8px 16px; border-radius: 20px; margin: 4px 8px 4px 0;">
                                        ${member}
                                    </span>
                                `).join('')}
                            </div>
                        ` : ''}
                        
                        ${isHackathon ? `
                            <div style="background: #ECFDF5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #065F46; font-weight: 500; margin-bottom: 10px;">Hackathon Details:</p>
                                <p style="margin: 0 0 8px 0; color: #374151;"><strong>Team:</strong> ${teamName || 'Team'}</p>
                                <p style="margin: 0 0 8px 0; color: #374151;"><strong>Problem Statement:</strong> ${problemStatement || 'To be worked on during the event'}</p>
                                ${teamMembers && teamMembers.length > 0 ? `
                                    <p style="margin: 0 0 8px 0; color: #374151;"><strong>Team Members:</strong></p>
                                    <div style="margin: 8px 0;">
                                        ${teamMembers.map((member: string, index: number) => `
                                            <span style="display: inline-block; background: ${index === 0 ? '#D1FAE5' : '#F3F4F6'}; color: ${index === 0 ? '#065F46' : '#374151'}; padding: 8px 16px; border-radius: 20px; margin: 4px 8px 4px 0;">
                                                ${index === 0 ? '👑 ' : ''}${member}
                                            </span>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; color: #374151;">Your Registration ID: <strong>${uid}</strong></p>
                        </div>

                        <div style="background: #F0FDF4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #166534; font-weight: 500; margin-bottom: 10px;">Stay Updated!</p>
                            <a href="${whatsappLink}" style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" style="height: 20px; width: 20px; vertical-align: middle; margin-right: 8px;">
                                Join ${whatsappGroupName}
                            </a>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #166534;">Join our WhatsApp group for important updates and announcements.</p>
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