import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB, isMemoryMode } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Helper to convert "HH:mm" time strings (e.g. "10:00", "14:30") to minutes for overlap checking
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  return hours * 60 + minutes;
}

// POST /api/bookings - Reserve a studio slot (Challenge 1 & Challenge 2)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      studioId,
      shootDate,
      startTime,
      endTime,
      crewCount,
      gearNotes,
    } = req.body;

    if (!studioId || !shootDate || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Studio ID, shoot date, start time, and end time are required.',
      });
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time.',
      });
    }

    const durationHours = Math.max(1, Math.round((endMinutes - startMinutes) / 60));

    const db = getDB();

    // 1. Fetch Studio specifications
    let studio: any = null;
    if (isMemoryMode()) {
      studio = await db.getCollection('studios').findOne({ _id: studioId }) || await db.getCollection('studios').findOne({ id: studioId });
    } else {
      try {
        studio = await db.collection('studios').findOne({ _id: new ObjectId(studioId) });
      } catch (e) {
        studio = await db.collection('studios').findOne({ id: studioId });
      }
    }

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio workspace not found.',
      });
    }

    // 2. Challenge 2 (Booking Double-Booking Prevention):
    // Verify time overlap against existing "Confirmed" (or active) bookings in MongoDB
    // Overlap condition: (newStart < existingEnd) && (newEnd > existingStart)
    let existingBookings: any[];
    if (isMemoryMode()) {
      existingBookings = await db.getCollection('bookings').find({
        studioId: studio._id.toString(),
        shootDate: shootDate,
        status: { $in: ['Confirmed', 'Pending'] },
      }).toArray();
    } else {
      existingBookings = await db.collection('bookings').find({
        studioId: studio._id.toString(),
        shootDate: shootDate,
        status: { $in: ['Confirmed', 'Pending'] },
      }).toArray();
    }

    const hasCollision = existingBookings.some((b: any) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return startMinutes < bEnd && endMinutes > bStart;
    });

    if (hasCollision) {
      return res.status(409).json({
        success: false,
        message: `Double-Booking Collision: The requested time slot (${startTime} - ${endTime}) overlaps with an existing reservation on ${shootDate}. Please select another hour or date.`,
      });
    }

    // Capacity verification
    const requestedCrew = Number(crewCount || 1);
    if (requestedCrew > studio.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: `Expected crew size (${requestedCrew}) exceeds studio maximum capacity (${studio.maxCapacity} creators).`,
      });
    }

    const hourlyRate = studio.hourlyRate;
    const securityDeposit = studio.securityDeposit || 0;
    const subtotal = durationHours * hourlyRate;
    const totalCost = subtotal + securityDeposit;

    const newBooking = {
      studioId: studio._id.toString(),
      studioTitle: studio.title,
      studioImage: studio.imageUrl || (studio.images && studio.images[0]) || '',
      studioLocation: studio.location,
      category: studio.category,
      userEmail: req.user!.email,
      userName: req.user!.name,
      shootDate,
      startTime,
      endTime,
      durationHours,
      hourlyRate,
      securityDeposit,
      subtotal,
      totalCost,
      crewCount: requestedCrew,
      gearNotes: gearNotes || '',
      status: 'Pending', // Initial status required: Pending
      createdAt: new Date().toISOString(),
    };

    let insertedId: any;
    if (isMemoryMode()) {
      const result = await db.getCollection('bookings').insertOne(newBooking);
      insertedId = result.insertedId;
    } else {
      const result = await db.collection('bookings').insertOne(newBooking);
      insertedId = result.insertedId;
    }

    return res.status(201).json({
      success: true,
      message: 'Reservation submitted successfully! Your booking is pending host confirmation.',
      booking: {
        ...newBooking,
        _id: insertedId.toString(),
        id: insertedId.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process studio reservation.',
    });
  }
});

// GET /api/bookings/my-bookings - Fetch creator's reservations (Challenge 1)
router.get('/my-bookings', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email;
    const db = getDB();
    let bookings: any[];

    if (isMemoryMode()) {
      bookings = await db.getCollection('bookings').find({ userEmail }).sort({ createdAt: -1 }).toArray();
    } else {
      bookings = await db.collection('bookings').find({ userEmail }).sort({ createdAt: -1 }).toArray();
    }

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings: bookings.map(b => ({ ...b, id: b._id.toString() })),
    });
  } catch (error: any) {
    console.error('Error retrieving bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your studio reservations.',
    });
  }
});

// PATCH /api/bookings/:id/cancel - Cancel a pending reservation (Challenge 1)
router.patch('/:id/cancel', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    let booking: any = null;

    if (isMemoryMode()) {
      booking = await db.getCollection('bookings').findOne({ _id: id }) || await db.getCollection('bookings').findOne({ id });
    } else {
      try {
        booking = await db.collection('bookings').findOne({ _id: new ObjectId(id) });
      } catch (e) {
        booking = await db.collection('bookings').findOne({ id });
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.',
      });
    }

    // Verify ownership
    if (booking.userEmail !== req.user!.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You cannot modify reservations belonging to another creator.',
      });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been cancelled.',
      });
    }

    if (booking.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed reservations cannot be cancelled.',
      });
    }

    // Update status to Cancelled
    if (isMemoryMode()) {
      await db.getCollection('bookings').updateOne({ _id: booking._id }, { $set: { status: 'Cancelled', updatedAt: new Date().toISOString() } });
    } else {
      await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { status: 'Cancelled', updatedAt: new Date().toISOString() } });
    }

    return res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully. Refundable deposit has been released.',
      booking: { ...booking, status: 'Cancelled' },
    });
  } catch (error: any) {
    console.error('Error cancelling booking:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel reservation.',
    });
  }
});

// PATCH /api/bookings/:id/status - Update booking status (Host or Demo purpose)
router.patch('/:id/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Pending, Confirmed, Completed, or Cancelled.',
      });
    }

    const db = getDB();
    let booking: any = null;

    if (isMemoryMode()) {
      booking = await db.getCollection('bookings').findOne({ _id: id }) || await db.getCollection('bookings').findOne({ id });
      if (booking) {
        await db.getCollection('bookings').updateOne({ _id: booking._id }, { $set: { status, updatedAt: new Date().toISOString() } });
      }
    } else {
      try {
        booking = await db.collection('bookings').findOne({ _id: new ObjectId(id) });
      } catch (e) {
        booking = await db.collection('bookings').findOne({ id });
      }
      if (booking) {
        await db.collection('bookings').updateOne({ _id: booking._id }, { $set: { status, updatedAt: new Date().toISOString() } });
      }
    }

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Reservation status updated to ${status}.`,
      booking: { ...booking, status },
    });
  } catch (error: any) {
    console.error('Error updating booking status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reservation status.',
    });
  }
});

export default router;
