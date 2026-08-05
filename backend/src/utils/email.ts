import nodemailer from 'nodemailer';
import dns from 'dns';

// Force IPv4 for Nodemailer to prevent ENETUNREACH errors on platforms like Railway
// that may not fully support IPv6 outbound connections.
dns.setDefaultResultOrder('ipv4first');

// Use Ethereal Email for testing. In production, configure with real SMTP credentials.
const createTransporter = async () => {
  // If we don't have SMTP credentials in env, use Ethereal for testing
  if (!process.env.SMTP_HOST) {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  // Production configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendOtpEmail = async (to: string, otp: string) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"Platform Admin" <no-reply@platform.com>',
      to,
      subject: 'Store Creation Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Store Verification Code</h2>
          <p>Thank you for setting up your store. Please use the following code to verify your email address and complete the setup process:</p>
          <div style="padding: 15px; background-color: #f4f4f5; font-size: 24px; font-weight: bold; letter-spacing: 5px; width: fit-content; border-radius: 8px;">
            ${otp}
          </div>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log('OTP Email sent: %s', info.messageId);
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendWelcomeEmail = async (to: string, storeName: string, customerUrl: string, adminUrl: string) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"Platform Admin" <no-reply@platform.com>',
      to,
      subject: `Congratulations! ${storeName} is Live`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Congratulations on launching ${storeName}!</h2>
          <p>Your store has been successfully created and is now live.</p>
          
          <h3>Your Store URLs</h3>
          <ul>
            <li><strong>Customer Storefront:</strong> <a href="${customerUrl}">${customerUrl}</a></li>
            <li><strong>Admin Dashboard:</strong> <a href="${adminUrl}">${adminUrl}</a></li>
          </ul>
          
          <p>Best of luck with your new business!</p>
        </div>
      `,
    });

    console.log('Welcome Email sent: %s', info.messageId);
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // We don't necessarily want to throw here if the store is already created
  }
};

export const sendOrderNotificationEmail = async (
  to: string, 
  storeName: string, 
  orderDetails: {
    orderNumber: string;
    total: number;
    subtotal: number;
    tax: number;
    shippingFee: number;
    paymentMethod: string;
    customerName: string;
    customerEmail: string;
    shippingAddress: any;
    items: Array<{ name: string; quantity: number; price: number }>;
  }
) => {
  try {
    const transporter = await createTransporter();
    
    let itemsHtml = orderDetails.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto;">
        <h2 style="color: #333;">New Order for ${storeName}!</h2>
        <p>You have received a new order (<strong>${orderDetails.orderNumber}</strong>).</p>
        
        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Customer Details</h3>
        <p>
          <strong>Name:</strong> ${orderDetails.customerName}<br>
          <strong>Email:</strong> ${orderDetails.customerEmail}<br>
          <strong>Payment Method:</strong> ${orderDetails.paymentMethod.toUpperCase()}
        </p>
        
        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Shipping Address</h3>
        <p>
          ${orderDetails.shippingAddress.address || 'N/A'}<br>
          ${orderDetails.shippingAddress.city || ''}, ${orderDetails.shippingAddress.state || ''} ${orderDetails.shippingAddress.zip || ''}<br>
          ${orderDetails.shippingAddress.country || ''}
        </p>

        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: left;">Item</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd;">Qty</th>
              <th style="padding: 8px; border-bottom: 2px solid #ddd; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="text-align: right; margin-top: 15px;">
          <p style="margin: 5px 0;">Subtotal: <strong>$${orderDetails.subtotal.toFixed(2)}</strong></p>
          <p style="margin: 5px 0;">Tax: <strong>$${orderDetails.tax.toFixed(2)}</strong></p>
          <p style="margin: 5px 0;">Shipping: <strong>$${orderDetails.shippingFee.toFixed(2)}</strong></p>
          <h3 style="margin: 10px 0;">Total: $${orderDetails.total.toFixed(2)}</h3>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #777;">Please log in to your admin dashboard to manage this order.</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"Platform Admin" <no-reply@platform.com>',
      to,
      subject: `New Order Received: ${orderDetails.orderNumber}`,
      html
    });
    console.log('Order Email sent: %s', info.messageId);
    if (!process.env.SMTP_HOST) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending order notification email:', error);
  }
};