import { admin } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, recipientId, title, body: bodyText, data } = body;

    // Validate required fields
    if (!type || !recipientId || !title || !bodyText) {
      return NextResponse.json(
        { error: 'Missing required fields: type, recipientId, title, body' },
        { status: 400 }
      );
    }

    // Fetch recipient user data
    const userDoc = await admin.firestore.collection('users').doc(recipientId).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Recipient user not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const fcmToken = userData?.['13_fcmToken'];
    const notificationEnabled = userData?.['14_notification'];

    console.log(`Fetched user data for ${recipientId}:`, {
      hasToken: !!fcmToken,
      notificationEnabled,
    });

    // Check if user has notifications enabled
    if (!notificationEnabled) {
      return NextResponse.json(
        { success: false, message: 'User has notifications disabled' },
        { status: 200 }
      );
    }

    // Check if FCM token exists
    if (!fcmToken) {
      return NextResponse.json(
        { error: 'User has no FCM token' },
        { status: 400 }
      );
    }

    // Build notification payload based on type
    let notificationData = {
      type: type,
      ...data,
    };

    // Ensure all data fields are strings (FCM requirement)
    Object.keys(notificationData).forEach(key => {
      if (notificationData[key] !== null && notificationData[key] !== undefined) {
        notificationData[key] = String(notificationData[key]);
      }
    });

    const payload = {
      notification: {
        title,
        body: bodyText,
      },
      data: notificationData,
      // Android specific options
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'marhabten_notifications',
        },
      },
      // iOS specific options
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    console.log('Prepared FCM payload:', {
      type,
      recipientId,
      hasToken: !!fcmToken,
    });

    // Send notification
    const response = await admin.messaging.send({
      token: fcmToken,
      ...payload,
    });

    console.log('FCM response:', response);

    return NextResponse.json({
      success: true,
      messageId: response,
      recipientId,
      type,
    });
  } catch (error) {
    console.error('FCM send error:', error);
    return NextResponse.json(
      { error: error.message, details: error.stack },
      { status: 500 }
    );
  }
}

/**
 * Expected request body format:
 *
 * For Booking Notifications:
 * {
 *   "type": "booking",
 *   "recipientId": "hostUserId",
 *   "title": "New Booking!",
 *   "body": "John Doe booked your property 'Beach House' from 01/01/2025 to 05/01/2025",
 *   "data": {
 *     "bookingId": "booking123",
 *     "propertyId": "property456",
 *     "guestName": "John Doe",
 *     "checkInDate": "01/01/2025",
 *     "checkOutDate": "05/01/2025"
 *   }
 * }
 *
 * For Message Notifications:
 * {
 *   "type": "message",
 *   "recipientId": "recipientUserId",
 *   "title": "New Message from John Doe",
 *   "body": "Hey, I have a question about the property...",
 *   "data": {
 *     "chatId": "chat123",
 *     "senderId": "sender456",
 *     "senderName": "John Doe"
 *   }
 * }
 *
 * For Booking Cancellation:
 * {
 *   "type": "booking_canceled",
 *   "recipientId": "userId",
 *   "title": "Booking Canceled",
 *   "body": "A booking for 'Beach House' has been canceled",
 *   "data": {
 *     "bookingId": "booking123",
 *     "propertyId": "property456"
 *   }
 * }
 *
 * For Payment Success:
 * {
 *   "type": "payment_success",
 *   "recipientId": "guestUserId",
 *   "title": "Payment Successful",
 *   "body": "Your payment of $500 for 'Beach House' was successful",
 *   "data": {
 *     "bookingId": "booking123",
 *     "amount": "500",
 *     "propertyName": "Beach House"
 *   }
 * }
 */
