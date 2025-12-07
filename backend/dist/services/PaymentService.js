"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
class PaymentService {
    clientId;
    clientSecret;
    mode;
    baseUrl;
    constructor() {
        this.clientId = process.env.PAYPAL_CLIENT_ID || '';
        this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
        this.mode = (process.env.PAYPAL_MODE || 'live');
        this.baseUrl = this.mode === 'sandbox'
            ? 'https://api-m.sandbox.paypal.com'
            : 'https://api-m.paypal.com';
        if (!this.clientId || !this.clientSecret) {
            console.warn('⚠️ PayPal credentials not configured');
        }
    }
    // Get PayPal access token
    async getAccessToken() {
        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        try {
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'grant_type=client_credentials',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Failed to get access token: ${data.error_description || data.message}`);
            }
            return data.access_token;
        }
        catch (error) {
            console.error('❌ Error getting PayPal access token:', error);
            throw error;
        }
    }
    // Create PayPal order
    async createOrder(bookingData) {
        try {
            const accessToken = await this.getAccessToken();
            const orderId = bookingData.bookingId || `booking_${Date.now()}`;
            const orderPayload = {
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        reference_id: orderId,
                        amount: {
                            currency_code: 'SEK',
                            value: bookingData.totalPrice.toFixed(2),
                            breakdown: {
                                item_total: {
                                    currency_code: 'SEK',
                                    value: bookingData.totalPrice.toFixed(2),
                                },
                            },
                        },
                        items: [
                            {
                                name: bookingData.service,
                                quantity: '1',
                                unit_amount: {
                                    currency_code: 'SEK',
                                    value: bookingData.totalPrice.toFixed(2),
                                },
                            },
                        ],
                        shipping: {
                            name: {
                                full_name: bookingData.name,
                            },
                            email_address: bookingData.email,
                            phone_number: {
                                national_number: bookingData.phone,
                            },
                        },
                    },
                ],
                payer: {
                    name: {
                        given_name: bookingData.name.split(' ')[0],
                        surname: bookingData.name.split(' ').slice(1).join(' '),
                    },
                    email_address: bookingData.email,
                },
                application_context: {
                    brand_name: 'Ruaa Beauty',
                    locale: 'en-US',
                    landing_page: 'BILLING',
                    user_action: 'PAY_NOW',
                    return_url: `${process.env.FRONTEND_URL || 'https://www.ruaa-beauty.eu'}/payment-success`,
                    cancel_url: `${process.env.FRONTEND_URL || 'https://www.ruaa-beauty.eu'}/payment-cancel`,
                },
            };
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/v2/checkout/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'PayPal-Request-Id': `${orderId}_${Date.now()}`,
                },
                body: JSON.stringify(orderPayload),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Failed to create PayPal order: ${data.details?.[0]?.issue || data.message}`);
            }
            console.log('✅ PayPal order created:', data.id);
            return data.id;
        }
        catch (error) {
            console.error('❌ Error creating PayPal order:', error);
            throw error;
        }
    }
    // Capture PayPal order (complete payment)
    async captureOrder(paypalOrderId) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Failed to capture PayPal order: ${data.details?.[0]?.issue || data.message}`);
            }
            console.log('✅ PayPal order captured:', data.id);
            return {
                orderId: data.id,
                status: data.status,
                payer: data.payer,
                purchaseUnits: data.purchase_units,
            };
        }
        catch (error) {
            console.error('❌ Error capturing PayPal order:', error);
            throw error;
        }
    }
    // Get order details
    async getOrderDetails(paypalOrderId) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await (0, node_fetch_1.default)(`${this.baseUrl}/v2/checkout/orders/${paypalOrderId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Failed to get PayPal order details: ${data.details?.[0]?.issue || data.message}`);
            }
            return data;
        }
        catch (error) {
            console.error('❌ Error getting PayPal order details:', error);
            throw error;
        }
    }
    // Get booking ID from PayPal order reference
    getBookingIdFromOrder(orderDetails) {
        try {
            const referenceId = orderDetails.purchase_units?.[0]?.reference_id;
            return referenceId || null;
        }
        catch (error) {
            console.error('❌ Error extracting booking ID:', error);
            return null;
        }
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=PaymentService.js.map