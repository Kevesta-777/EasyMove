import { Request, Response } from "express";
import { db } from "../db";
import { paymentIntents, bookings, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { jsonb } from "drizzle-orm/pg-core";

export const paymentRoutes = async (app: any) => {
  // Get all payments with booking details
  app.get('/api/payments', async (req: Request, res: Response) => {
    try {
      const payments = await db
        .select({
          payment: paymentIntents,
          booking: bookings,
          customer: users
        })
        .from(paymentIntents)
        .innerJoin(bookings, eq(paymentIntents.bookingId, bookings.id))
        .innerJoin(users, eq(bookings.customerId, users.id))
        .orderBy(desc(paymentIntents.createdAt));
      
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payment data' });
    }
  });

  // Get payment details by ID
  app.get('/api/payments/:id', async (req: Request, res: Response) => {
    try {
      const paymentId = req.params.id;
      const payment = await db
        .select({
          payment: paymentIntents,
          booking: bookings,
          customer: users
        })
        .from(paymentIntents)
        .innerJoin(bookings, eq(paymentIntents.bookingId, bookings.id))
        .innerJoin(users, eq(bookings.customerId, users.id))
        .where(eq(paymentIntents.id, paymentId));
      
      if (payment.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      res.json(payment[0]);
    } catch (error) {
      console.error('Error fetching payment details:', error);
      res.status(500).json({ error: 'Failed to fetch payment details' });
    }
  });

  // Update payment status
  app.put('/api/payments/:id/status', async (req: Request, res: Response) => {
    try {
      const paymentId = req.params.id;
      const { status } = req.body;

      // Update payment status
      await db.update(paymentIntents)
        .set({ status })
        .where(eq(paymentIntents.id, paymentId));

      // If payment succeeded, update booking status
      if (status === 'succeeded') {
        const booking = await db
          .select({
            id: bookings.id,
            status: bookings.status
          })
          .from(paymentIntents)
          .innerJoin(bookings, eq(paymentIntents.bookingId, bookings.id))
          .where(eq(paymentIntents.id, paymentId));

        if (booking.length > 0 && booking[0].status === 'pending') {
          await db.update(bookings)
            .set({ status: 'confirmed' })
            .where(eq(bookings.id, booking[0].id));
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating payment status:', error);
      res.status(500).json({ error: 'Failed to update payment status' });
    }
  });

  // Create new payment intent
  app.post('/api/payments', async (req: Request, res: Response) => {
    try {
      const { 
        bookingId, 
        paymentProvider, 
        providerId, 
        amount, 
        currency, 
        method,
        metadata
      } = req.body;

      const payment = await db.insert(paymentIntents)
        .values({
          bookingId,
          paymentProvider,
          providerId,
          amount,
          currency,
          status: 'pending',
          method,
          metadata
        })
        .returning();

      res.json(payment[0]);
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Refund payment
  app.post('/api/payments/:id/refund', async (req: Request, res: Response) => {
    try {
      const paymentId = req.params.id;
      const { amount } = req.body;

      // Update payment status to refunded
      await db.update(paymentIntents)
        .set({ 
          status: 'refunded',
          metadata: { refunds: [{ amount, timestamp: new Date().toISOString() }] }
        })
        .where(eq(paymentIntents.id, paymentId));

      // Update booking status if needed
      const booking = await db
        .select({
          id: bookings.id,
          status: bookings.status
        })
        .from(paymentIntents)
        .innerJoin(bookings, eq(paymentIntents.bookingId, bookings.id))
        .where(eq(paymentIntents.id, paymentId));

      if (booking.length > 0) {
        await db.update(bookings)
          .set({ status: 'cancelled' })
          .where(eq(bookings.id, booking[0].id));
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error refunding payment:', error);
      res.status(500).json({ error: 'Failed to refund payment' });
    }
  });
};
