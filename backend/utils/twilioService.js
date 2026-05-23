import twilio from 'twilio';
import User from '../models/User.js';

let client;

/**
 * Normalize phone number to E.164 format
 * Adds +1 if the number doesn't start with +1 or + (for international)
 * @param {string} phoneNumber - The phone number to normalize
 * @returns {string} - Normalized phone number in E.164 format
 */
export const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) {
        return phoneNumber;
    }
    
    // Remove all whitespace and special characters except +, -, and digits
    let cleaned = phoneNumber.trim().replace(/\s+/g, '');
    
    // If it already starts with +, return as is (international number)
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    
    // If it starts with 1 (without +), add +
    if (cleaned.startsWith('1') && cleaned.length >= 11) {
        return `+${cleaned}`;
    }
    
    // Otherwise, add +1 prefix
    // Remove leading 0 if present
    if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }
    
    // Remove any remaining non-digit characters
    const digitsOnly = cleaned.replace(/\D/g, '');
    
    // If it's 10 digits, add +1
    if (digitsOnly.length === 10) {
        return `+1${digitsOnly}`;
    }
    
    // If it's 11 digits and starts with 1, add +
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        return `+${digitsOnly}`;
    }
    
    // For other cases, try to add +1
    return `+1${digitsOnly}`;
};

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
    
    // Normalize phone number before sending
    const normalizedPhone = normalizePhoneNumber(to);
    
    if (!twilioClient) {
        console.log(`[Mock Twilio WhatsApp] Would send to ${normalizedPhone}: ${body}`);
        return;
    }

    try {
        // Ensure the number has the 'whatsapp:' prefix
        const toNum = normalizedPhone.startsWith('whatsapp:') ? normalizedPhone : `whatsapp:${normalizedPhone}`;
        const fromNum = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Default sandbox number

        await twilioClient.messages.create({
            body: body,
            from: fromNum,
            to: toNum
        });
        console.log(`WhatsApp message sent to ${normalizedPhone} (original: ${to})`);
    } catch (error) {
        console.error(`Error sending WhatsApp message to ${normalizedPhone}:`, error.message);
        throw error;
    }
};

/**
 * Send SMS message to a specific number
 * @param {string} to - Recipient phone number (e.g., '+1234567890')
 * @param {string} body - Message body
 */
export const sendSMS = async (to, body) => {
    const twilioClient = getClient();
    
    // Normalize phone number before sending
    const normalizedPhone = normalizePhoneNumber(to);
    
    if (!twilioClient) {
        console.log(`[Mock Twilio SMS] Would send to ${normalizedPhone}: ${body}`);
        return;
    }

    try {
        const fromNum = process.env.TWILIO_PHONE_NUMBER; // Your Twilio SMS number

        if (!fromNum) {
            console.warn('TWILIO_PHONE_NUMBER not set for SMS, falling back to mock');
            console.log(`[Mock Twilio SMS] Would send to ${normalizedPhone}: ${body}`);
            return;
        }

        await twilioClient.messages.create({
            body: body,
            from: fromNum,
            to: normalizedPhone
        });
        console.log(`SMS sent to ${normalizedPhone} (original: ${to})`);
    } catch (error) {
        console.error(`Error sending SMS to ${normalizedPhone}:`, error.message);
        throw error;
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
 * Notify users who want updates for a specific lottery (new prediction or result announced).
 * Only sends SMS when Prediction Notifications is enabled. Verification messages (OTP) are
 * always sent regardless of this setting.
 *
 * @param {string} lotteryType - The type of lottery (e.g., 'gopher5')
 * @param {string} message - The message to send
 */
export const notifyUsersByLottery = async (lotteryType, message) => {
    try {
        // Only users with Prediction Notifications enabled receive lottery SMS.
        // Match: (preferred lottery OR lottery in notificationLotteries) AND predictionNotificationsEnabled === true
        const users = await User.find({
            $and: [
                { predictionNotificationsEnabled: true },
                { phone: { $exists: true, $ne: '' } },
                { role: { $ne: 'admin' } },
                {
                    $or: [
                        { selectedLottery: lotteryType },
                        { notificationLotteries: lotteryType }
                    ]
                }
            ]
        }).select('phone predictionNotificationsEnabled selectedLottery notificationLotteries role _id');

        // Double-check: do not send if user has disabled Prediction Notifications
        const eligibleUsers = users.filter(user => {
            const isEnabled = user.predictionNotificationsEnabled === true;
            const isNotAdmin = user.role !== 'admin';

            if (!isEnabled) {
                console.log(`Skipping user ${user.phone} - Prediction Notifications disabled`);
            }
            if (!isNotAdmin) {
                console.log(`Skipping admin user ${user.phone} - admins do not receive prediction notifications`);
            }

            return isEnabled && isNotAdmin;
        });

        console.log(`Found ${users.length} total users for ${lotteryType}, ${eligibleUsers.length} with prediction notifications enabled`);

        if (eligibleUsers.length === 0) {
            console.log('No users eligible for prediction notifications - all users have disabled this feature');
            return 0;
        }

        // Send messages in parallel (or consider batching/queueing for large scale)
        // Using SMS by default as per request. Can be switched to sendWhatsAppMessage if preferred.
        // Or could check user preference. For now, using SMS.
        const promises = eligibleUsers.map(user => {
            console.log(`Sending prediction notification to ${user.phone} (predictionNotificationsEnabled: ${user.predictionNotificationsEnabled})`);
            return sendSMS(user.phone, message);
        });
        await Promise.all(promises);

        return eligibleUsers.length;
    } catch (error) {
        console.error('Error in notifyUsersByLottery:', error);
        return 0;
    }
};
