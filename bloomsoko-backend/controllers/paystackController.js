import nodemailer from 'nodemailer';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Initialize Paystack payment
export const initializePayment = async (req, res) => {
  try {
    const { amount, email, metadata } = req.body;
    const userId = req.headers.userid || 'demo-user';

    if (!amount || !email) {
      return res.status(400).json({
        success: false,
        message: 'Amount and email are required'
      });
    }

    // Create order in pending state
    const orderData = {
      user: userId,
      recipient: {
        firstName: metadata.recipient.firstName,
        lastName: metadata.recipient.lastName,
        email: metadata.recipient.email,
        phone: metadata.recipient.phone,
        idNumber: metadata.recipient.idNumber
      },
      pickup: {
        option: metadata.pickup.option,
        station: metadata.pickup.station,
        county: metadata.pickup.county,
        stationDetails: metadata.pickup.stationDetails
      },
      items: metadata.items.map(item => ({
        product: item.productId || item._id,
        quantity: item.quantity,
        price: item.price,
        name: item.product?.name || item.name || 'Product',
        image: item.product?.featuredImage?.url || item.image || '',
        isBooking: item.isBooking || false
      })),
      subtotal: amount / 100,
      totalAmount: amount / 100,
      specialInstructions: metadata.specialInstructions || '',
      status: 'pending',
      paymentStatus: 'pending'
    };

    console.log('Creating order with items:', orderData.items);

    const order = new Order(orderData);
    await order.save();

    console.log('Order created successfully:', order.orderNumber);

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount),
        reference: order.orderNumber,
        callback_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-callback`,
        metadata: {
          orderId: order._id.toString(),
          userId,
          custom_fields: [
            {
              display_name: "Order Number",
              variable_name: "order_number",
              value: order.orderNumber
            },
            {
              display_name: "Recipient Name",
              variable_name: "recipient_name",
              value: metadata.recipient.firstName + ' ' + metadata.recipient.lastName
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      success: true,
      message: 'Payment initialized successfully',
      data: response.data.data
    });

  } catch (error) {
    console.error('Paystack initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize payment',
      error: error.response?.data?.message || error.message
    });
  }
};

// Verify Paystack payment
export const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Paystack secret key not configured'
      });
    }

    // Verify payment with Paystack
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const paymentData = response.data.data;

    if (paymentData.status === 'success') {
      // Find order by reference (which is our orderNumber)
      const order = await Order.findOne({ orderNumber: reference }).populate('items.product');
      
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      console.log(`✅ Payment successful for order: ${order.orderNumber}`);

      // Check if order is already processed to avoid duplicates
      if (order.status === 'completed' && order.paymentStatus === 'paid') {
        console.log(`📦 Order ${order.orderNumber} already completed, skipping duplicate processing`);
        return res.json({
          success: true,
          message: 'Order already processed',
          data: { order }
        });
      }

      // Update order status
      order.paymentStatus = 'paid';
      order.status = 'completed';
      order.paystackReference = paymentData.reference;
      
      // Only send email if it hasn't been sent already
      if (!order.emailSent) {
        order.emailSent = true; // Mark email as sent
        await order.save();
        
        console.log(`📦 Order ${order.orderNumber} marked as completed`);

        // Clear user's cart
        const cartResult = await Cart.findOneAndUpdate(
          { user: order.user },
          { items: [] }
        );
        
        console.log(`🛒 Cart cleared for user: ${order.user}`);

        // Send confirmation email
        console.log(`📧 Attempting to send email to: ${order.recipient.email}`);
        const emailResult = await sendOrderConfirmationEmail(order);
        console.log(`📧 Email send result:`, emailResult.success ? 'Success' : 'Failed');
      } else {
        await order.save();
        console.log(`📧 Email already sent for order: ${order.orderNumber}, skipping duplicate email`);
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          order: {
            _id: order._id,
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            recipient: order.recipient
          },
          payment: paymentData,
          redirectUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/order-success`
        }
      });
    } else {
      console.log(`❌ Payment failed for reference: ${reference}`);
      res.status(400).json({
        success: false,
        message: 'Payment not successful',
        data: paymentData
      });
    }

  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.response?.data?.message || error.message
    });
  }
};
// ✅ FIXED EMAIL SERVICE FUNCTIONS
const createTransport = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('❌ Email credentials not configured');
    return null;
  }
  
  // ✅ FIXED HERE
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

const sendEmail = async (emailData) => {
  try {
    const transporter = createTransport();
    if (!transporter) {
      return { success: false, error: 'Email transporter not configured' };
    }

    const mailOptions = {
      from: `"Bloomsoko" <${process.env.EMAIL_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: generateEmailTemplate(emailData.template, emailData.context)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', emailData.to);
    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

const generateEmailTemplate = (template, context) => {
  const templates = {
    'order-confirmation': `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
          .header { background: linear-gradient(135deg, #2E7D32 0%, #1B5E20 100%); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .order-details { background: white; padding: 20px; margin: 15px 0; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .alert { background: #FFF3E0; padding: 15px; border-left: 4px solid #FF9800; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; background: #f5f5f5; }
          .item { display: flex; justify-content: space-between; margin: 8px 0; }
          .total { font-size: 1.2em; font-weight: bold; color: #2E7D32; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
            <p>Thank you for shopping with Bloomsoko</p>
          </div>
          <div class="content">
            <h2>Hello ${context.recipientName},</h2>
            <p>Your order <strong>${context.orderNumber}</strong> has been confirmed and is being processed.</p>
            
            <div class="order-details">
              <h3>Order Summary</h3>
              ${context.items.map(item => `
                <div class="item">
                  <span>${item.name} x ${item.quantity}</span>
                  <span>KSh ${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              `).join('')}
              <hr>
              <div class="item total">
                <span>Total Amount:</span>
                <span>KSh ${context.subtotal.toLocaleString()}</span>
              </div>
              <p><em>Shipping fee to be paid at pickup station</em></p>
            </div>

            <div class="order-details">
              <h3>Pickup Information</h3>
              <p><strong>Station:</strong> ${context.pickupStation}</p>
              <p><strong>Address:</strong> ${context.stationAddress}</p>
              <p><strong>County:</strong> ${context.pickupCounty}</p>
              <p><strong>Contact:</strong> ${context.stationContact}</p>
              <p><strong>Operating Hours:</strong> ${context.operatingHours}</p>
              <p><strong>Facilities:</strong> ${context.facilities}</p>
            </div>

            <div class="alert">
              <h3>Important Pickup Instructions</h3>
              <ul>
                <li>Carry your <strong>Original National ID</strong> for verification</li>
                <li>Pay shipping fee at the station (amount varies by location)</li>
                <li>Provide your order number: <strong>${context.orderNumber}</strong></li>
                <li>Collect your package within 7 days</li>
                <li>Contact station if you need to extend pickup period</li>
              </ul>
            </div>

            ${context.specialInstructions ? `
              <div class="order-details">
                <h3>Special Instructions</h3>
                <p>${context.specialInstructions}</p>
              </div>
            ` : ''}

            <div class="order-details">
              <h3>Need Help?</h3>
              <p>Email: bloomsoko@gmail.com</p>
              <p>Phone: +254 708 756 517</p>
            </div>
          </div>
          <div class="footer">
            <p>Thank you for choosing Bloomsoko!</p>
            <p>© 2025 Bloomsoko. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return templates[template] || '<p>Email content not available</p>';
};
// Webhook for Paystack events
export const paystackWebhook = async (req, res) => {
  try {
    const secret = req.headers['x-paystack-signature'];
    
    if (!process.env.PAYSTACK_WEBHOOK_SECRET) {
      return res.status(500).send('Webhook secret not configured');
    }

    // Verify webhook signature
    const crypto = await import('crypto');
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== secret) {
      console.error('❌ Webhook signature verification failed');
      return res.status(401).send('Webhook signature verification failed');
    }

    const event = req.body;
    console.log(`🔄 Paystack webhook received: ${event.event}`);

    if (event.event === 'charge.success') {
      const paymentData = event.data;
      
      // Find and update order
      const order = await Order.findOne({ orderNumber: paymentData.reference });
      if (order && order.paymentStatus !== 'paid') {
        // Only process if payment hasn't been processed yet
        order.paymentStatus = 'paid';
        order.status = 'completed';
        order.paystackReference = paymentData.reference;
        
        // Only send email if it hasn't been sent
        if (!order.emailSent) {
          order.emailSent = true;
          await order.save();

          // Clear cart
          await Cart.findOneAndUpdate(
            { user: order.user },
            { items: [] }
          );

          // Send confirmation email
          await sendOrderConfirmationEmail(order);
          console.log(`✅ Webhook: Order ${order.orderNumber} processed and email sent`);
        } else {
          await order.save();
          console.log(`✅ Webhook: Order ${order.orderNumber} already processed, skipping email`);
        }
      } else if (order && order.paymentStatus === 'paid') {
        console.log(`✅ Webhook: Order ${order.orderNumber} already paid, skipping`);
      }
    }

    res.status(200).send('Webhook processed successfully');

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Webhook processing failed');
  }
}
// Keep your original template logic and structure unchanged
const sendOrderConfirmationEmail = async (order) => {
  try {
    console.log('🔄 Attempting to send email to:', order.recipient.email);
    
    const emailData = {
      to: order.recipient.email,
      subject: `Order Confirmation - ${order.orderNumber}`,
      template: 'order-confirmation',
      context: {
        orderNumber: order.orderNumber,
        recipientName: `${order.recipient.firstName} ${order.recipient.lastName}`,
        pickupStation: order.pickup.station,
        pickupCounty: order.pickup.county,
        stationAddress: order.pickup.stationDetails?.address || 'N/A',
        stationContact: order.pickup.stationDetails?.contact || 'N/A',
        operatingHours: order.pickup.stationDetails?.hours || 'N/A',
        facilities: order.pickup.stationDetails?.facilities?.join(', ') || 'N/A',
        items: order.items.map(item => ({
          name: item.product?.name || item.name || 'Product',
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: order.subtotal,
        specialInstructions: order.specialInstructions
      }
    };

    console.log('📧 Email data prepared:', emailData);

    const emailResult = await sendEmail(emailData);
    
    if (emailResult.success) {
      console.log(`✅ Order confirmation email sent to ${order.recipient.email}`);
    } else {
      console.log(`❌ Email failed:`, emailResult.error);
    }
    
    return emailResult;
    
  } catch (error) {
    console.error('❌ Error in sendOrderConfirmationEmail:', error);
    return { success: false, error: error.message };
  }
};
