import { Router, Request, Response } from 'express';
import { db } from '../db';
import { bookings, users, drivers } from '../../shared/schema';
import { eq, gte, count, sum, desc, or, ilike } from 'drizzle-orm';
import { z } from 'zod';

// Type for booking response
interface BookingResponse {
  id: number;
  status: string;
  moveDate: string;
  vanSize: string;
  price: number;
  distance: number;
  collectionAddress: string;
  deliveryAddress: string;
  createdAt: string;
  customer: {
    id: number;
    username: string;
    email: string;
  } | null;
  driver: {
    id: number;
    name: string;
    phone: string;
  } | null;
}

const router = Router();

// Admin statistics endpoint
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Set cache control headers
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');

    // Get total bookings
    const totalBookings = await db
      .select({ count: count() })
      .from(bookings)
      .then(([result]) => result.count);

    // Get new users (created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thirtyDaysAgo))
      .then(([result]) => result.count);

    // Get new drivers (created in last 30 days)
    const newDrivers = await db
      .select({ count: count() })
      .from(drivers)
      .where(gte(drivers.createdAt, thirtyDaysAgo))
      .then(([result]) => result.count);

    // Get total revenue
    const totalRevenue = await db
      .select({ revenue: sum(bookings.price) })
      .from(bookings)
      .then(([result]) => result.revenue || 0);

    // Get pending drivers
    const pendingDrivers = await db
      .select({ count: count() })
      .from(drivers)
      .where(eq(drivers.approvalStatus, 'pending'))
      .then(([result]) => result.count);

    // Get active complaints (assuming complaints table exists)
    const activeComplaints = 0; // This will need to be implemented when complaints table is added

    // Get bookings by time period
    const today = new Date();
    const thisWeek = new Date();
    const thisMonth = new Date();
    
    today.setHours(0, 0, 0, 0);
    thisWeek.setDate(thisWeek.getDate() - 7);
    thisMonth.setDate(1);

    const todayBookings = await db
      .select({ count: count() })
      .from(bookings)
      .where(gte(bookings.createdAt, today))
      .then(([result]) => result.count);

    const thisWeekBookings = await db
      .select({ count: count() })
      .from(bookings)
      .where(gte(bookings.createdAt, thisWeek))
      .then(([result]) => result.count);

    const thisMonthBookings = await db
      .select({ count: count() })
      .from(bookings)
      .where(gte(bookings.createdAt, thisMonth))
      .then(([result]) => result.count);

    res.json({
      totalBookings,
      newUsers,
      newDrivers,
      totalRevenue,
      pendingDrivers,
      activeComplaints,
      todayBookings,
      thisWeekBookings,
      thisMonthBookings
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Recent bookings endpoint
router.get('/recent-bookings', async (req: Request, res: Response) => {
  try {
    // Set cache control headers
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');

    const recentBookings = await db
      .select()
      .from(bookings)
      .orderBy(desc(bookings.createdAt))
      .limit(10)
      .then((results) => results);

    res.json(recentBookings);
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Pending drivers endpoint
router.get('/pending-drivers', async (req: Request, res: Response) => {
  try {
    // Set cache control headers
    res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');

    const allDrivers = await db
      .select()
      .from(drivers)
      .orderBy(desc(drivers.createdAt))
      .then((results) => results);

    res.json(allDrivers);
  } catch (error) {
    console.error('Error fetching pending drivers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/drivers/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!['approved', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    await db
      .update(drivers)
      .set({ approvalStatus: status })
      .where(eq(drivers.id, id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  // Bookings endpoint
  router.get('/bookings', async (req: Request, res: Response) => {
    try {
      const { searchTerm = '', status = 'all' } = req.query as any;
      
      // Build query based on filters
      const query = db
        .select({
          id: bookings.id,
          status: bookings.status,
          moveDate: bookings.moveDate,
          vanSize: bookings.vanSize,
          price: bookings.price,
          distance: bookings.distance,
          collectionAddress: bookings.collectionAddress,
          deliveryAddress: bookings.deliveryAddress,
          createdAt: bookings.createdAt,
          customerId: bookings.customerId,
          driverId: bookings.driverId
        })
        .from(bookings)
        .leftJoin(users, eq(bookings.customerId, users.id))
        .leftJoin(drivers, eq(bookings.driverId, drivers.id));

      // Add search filter
      if (searchTerm) {
        query.where(
          or(
            ilike(users.username, `%${searchTerm}%`),
            ilike(users.email, `%${searchTerm}%`),
            ilike(bookings.collectionAddress, `%${searchTerm}%`),
            ilike(bookings.deliveryAddress, `%${searchTerm}%`),
            eq(bookings.id, parseInt(searchTerm))
          )
        );
      }

      // Add status filter
      if (status !== 'all') {
        query.where(eq(bookings.status, status));
      }

      // Order by creation date (newest first)
      query.orderBy(desc(bookings.createdAt));

      const results = await query.then((rows) => 
        rows.map((row: any) => ({
          ...row,
          customer: row.customerId ? {
            id: row.customerId,
            username: users.username,
            email: users.email
          } : null,
          driver: row.driverId ? {
            id: row.driverId,
            name: drivers.name,
            phone: drivers.phone
          } : null
        }))
      );

      res.json(results as BookingResponse[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Update booking status endpoint
  router.post('/booking/:id/update', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      // Validate status
      const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      // Get the current booking
      const currentBooking = await db
        .select()
        .from(bookings)
        .where(eq(bookings.id, id))
        .then(([result]) => result);

      if (!currentBooking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Update the booking
      const result = await db
        .update(bookings)
        .set({ status })
        .where(eq(bookings.id, id))
        .returning();

      if (!result[0]) {
        return res.status(500).json({ error: 'Failed to update booking' });
      }

      // Return success response with updated booking
      return res.status(200).json({
        success: true,
        booking: result[0],
        previousStatus: currentBooking.status
      });
    } catch (error) {
      console.error('Error updating booking status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  export default router;
