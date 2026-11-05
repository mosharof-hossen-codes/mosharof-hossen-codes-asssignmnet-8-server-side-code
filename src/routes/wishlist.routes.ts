import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB, isMemoryMode } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/wishlist/ids - Returns list of wishlisted studio IDs for current user
router.get('/ids', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email;
    const db = getDB();
    let items: any[];

    if (isMemoryMode()) {
      items = await db.getCollection('wishlist').find({ userEmail }).toArray();
    } else {
      items = await db.collection('wishlist').find({ userEmail }).toArray();
    }

    const studioIds = items.map(item => item.studioId);
    return res.status(200).json({
      success: true,
      studioIds,
    });
  } catch (error: any) {
    console.error('Error fetching wishlist ids:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wishlist IDs.',
    });
  }
});

// GET /api/wishlist - Returns full studio objects for user's wishlist
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email;
    const db = getDB();
    let items: any[];

    if (isMemoryMode()) {
      items = await db.getCollection('wishlist').find({ userEmail }).toArray();
    } else {
      items = await db.collection('wishlist').find({ userEmail }).toArray();
    }

    const studioIds = items.map(item => item.studioId);
    let studios: any[] = [];

    if (studioIds.length > 0) {
      if (isMemoryMode()) {
        const allStudios = await db.getCollection('studios').find({}).toArray();
        studios = allStudios.filter((s: any) => studioIds.includes(s._id.toString()) || studioIds.includes(s.id));
      } else {
        const objectIds = studioIds.map(id => {
          try {
            return new ObjectId(id);
          } catch (e) {
            return id;
          }
        });
        studios = await db.collection('studios').find({
          $or: [
            { _id: { $in: objectIds } },
            { id: { $in: studioIds } }
          ]
        }).toArray();
      }
    }

    return res.status(200).json({
      success: true,
      count: studios.length,
      studios: studios.map(s => ({ ...s, id: s._id.toString() })),
    });
  } catch (error: any) {
    console.error('Error fetching wishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve wishlist studios.',
    });
  }
});

// POST /api/wishlist/toggle - Toggles studio in wishlist
router.post('/toggle', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { studioId } = req.body;
    const userEmail = req.user!.email;

    if (!studioId) {
      return res.status(400).json({
        success: false,
        message: 'Studio ID is required.',
      });
    }

    const db = getDB();
    let existingItem: any;

    if (isMemoryMode()) {
      existingItem = await db.getCollection('wishlist').findOne({ userEmail, studioId });
    } else {
      existingItem = await db.collection('wishlist').findOne({ userEmail, studioId });
    }

    if (existingItem) {
      // Remove from wishlist
      if (isMemoryMode()) {
        await db.getCollection('wishlist').deleteOne({ _id: existingItem._id });
      } else {
        await db.collection('wishlist').deleteOne({ _id: existingItem._id });
      }
      return res.status(200).json({
        success: true,
        wishlisted: false,
        message: 'Workspace removed from your saved wishlist.',
      });
    } else {
      // Add to wishlist
      const newItem = {
        userEmail,
        studioId,
        createdAt: new Date().toISOString(),
      };
      if (isMemoryMode()) {
        await db.getCollection('wishlist').insertOne(newItem);
      } else {
        await db.collection('wishlist').insertOne(newItem);
      }
      return res.status(200).json({
        success: true,
        wishlisted: true,
        message: 'Workspace saved to your wishlist!',
      });
    }
  } catch (error: any) {
    console.error('Error toggling wishlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update wishlist.',
    });
  }
});

export default router;
