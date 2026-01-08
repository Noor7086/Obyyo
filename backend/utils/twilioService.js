import twilio from 'twilio';
import User from '../models/User.js';

let client;

// Lazy initialization to handle ES module hoisting where env vars might not be loaded yet
const getClient = () => {
    if (client) return client;

    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        try {
            client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
            console.log('✅ Twilio client initialized successfully');
            return client;
        } catch (error) {
            console.error('❌ Failed to initialize Twilio client:', error.message);
            return null;
        }
    } else {
        // Only warn once
        if (!process.env.TWILIO_SILENT_WARN) {
            console.warn('⚠️ Twilio credentials not found in environment variables. SMS will be mocked.');
            process.env.TWILIO_SILENT_WARN = 'true';
        }
        return null;
    }
};

/**
 * Send WhatsApp message to a specific number
 * @param {string} to - Recipient phone number (e.g., '+1234567890')
 * @param {string} body - Message body
 */
export const sendWhatsAppMessage = async (to, body) => {
    const twilioClient = getClient();
    if (!twilioClient) {
        console.log(`[Mock Twilio WhatsApp] Would send to ${to}: ${body}`);
        return;
    }

    try {
        // Ensure the number has the 'whatsapp:' prefix
        const toNum = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        const fromNum = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default sandbox number

        await twilioClient.messages.create({
            body: body,
            from: fromNum,
            to: toNum
        });
        console.log(`WhatsApp message sent to ${to}`);
    } catch (error) {
        console.error(`Error sending WhatsApp message to ${to}:`, error.message);
    }
};

/**
 * Send SMS message to a specific number
 * @param {string} to - Recipient phone number (e.g., '+1234567890')
 * @param {string} body - Message body
 */
export const sendSMS = async (to, body) => {
    const twilioClient = getClient();
    if (!twilioClient) {
        console.log(`[Mock Twilio SMS] Would send to ${to}: ${body}`);
        return;
    }

    try {
        const fromNum = process.env.TWILIO_PHONE_NUMBER; // Your Twilio SMS number

        if (!fromNum) {
            console.warn('TWILIO_PHONE_NUMBER not set for SMS, falling back to mock');
            console.log(`[Mock Twilio SMS] Would send to ${to}: ${body}`);
            return;
        }

        await twilioClient.messages.create({
            body: body,
            from: fromNum,
            to: to
        });
        console.log(`SMS sent to ${to}`);
    } catch (error) {
        console.error(`Error sending SMS to ${to}:`, error.message);
    }
};

/**
 * Send OTP via SMS
 * @param {string} to - Recipient phone number
 * @param {string} otp - The OTP code
 */
export const sendOTP = async (to, otp) => {
    const message = `Your verification code is: ${otp}. Do not share this code with anyone.`;
    // We try SMS first, logic could be expanded to fallback or preference
    await sendSMS(to, message);
};

/**
 * Notify all users who prefer a specific lottery
 * @param {string} lotteryType - The type of lottery (e.g., 'gopher5')
 * @param {string} message - The message to send
 */
export const notifyUsersByLottery = async (lotteryType, message) => {
    try {
        // Find users who have selected this lottery and have notifications enabled
        // Also ensure they have a phone number
        const users = await User.find({
            selectedLottery: lotteryType,
            notificationsEnabled: true,
            phone: { $exists: true, $ne: '' }
        });

        console.log(`Found ${users.length} users to notify for ${lotteryType}`);

        // Send messages in parallel (or consider batching/queueing for large scale)
        // Using SMS by default as per request. Can be switched to sendWhatsAppMessage if preferred.
        // Or could check user preference. For now, using SMS.
        const promises = users.map(user => sendSMS(user.phone, message));
        await Promise.all(promises);

        return users.length;
    } catch (error) {
        console.error('Error in notifyUsersByLottery:', error);
        return 0;
    }
};
