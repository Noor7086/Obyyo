# Twilio WhatsApp Integration

This project integrates Twilio to send WhatsApp notifications to users when:
1.  A new prediction is uploaded for their selected lottery.
2.  A result is announced for their selected lottery.

## Setup

1.  **Create a Twilio Account**: Sign up at [twilio.com](https://www.twilio.com/).
2.  **Get Credentials**:
    -   Account SID
    -   Auth Token
    -   WhatsApp usage enabled (Use the Sandbox for development).
3.  **Configure `.env`**:
    Add the following variables to your `.env` file:

    ```env
    TWILIO_ACCOUNT_SID=your_account_sid
    TWILIO_AUTH_TOKEN=your_auth_token
    TWILIO_PHONE_NUMBER=whatsapp:+14155238886
    ```
    *Note: `TWILIO_PHONE_NUMBER` is the number provided by Twilio (e.g., the sandbox number).*

## How It Works

-   **Users**: Must have a valid phone number, notifications enabled, and a 'selected lottery' in their profile.
-   **Triggers**:
    -   **New Prediction**: When an admin uploads a new prediction via the admin dashboard.
    -   **New Result**: When an admin adds a result for a prediction.
-   **Service**: The logic is located in `backend/utils/twilioService.js`. It filters eligible users and sends messages asynchronously.

## Testing

1.  Ensure you have joined the Twilio WhatsApp Sandbox (if using sandbox) with your testing phone number.
2.  Trigger an action (upload prediction or result) from the Admin panel.
3.  Check the server console logs for: `[Twilio] Notification process started...` or `WhatsApp message sent to...`.
