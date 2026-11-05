import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB, isMemoryMode } from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// GET /api/studios/featured - Returns top 6 workspaces using .limit(6)
router.get('/featured', async (req, res) => {
  try {
    const db = getDB();
    let studios: any[];

    if (isMemoryMode()) {
      studios = await db.getCollection('studios').find({}).sort({ rating: -1, createdAt: -1 }).limit(6).toArray();
    } else {
      studios = await db.collection('studios').find({}).sort({ rating: -1, createdAt: -1 }).limit(6).toArray();
    }

    return res.status(200).json({
      success: true,
      count: studios.length,
      studios: studios.map(s => ({ ...s, id: s._id.toString() })),
    });
  } catch (error: any) {
    console.error('Error fetching featured studios:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured workspaces.',
    });
  }
});

// GET /api/studios/user/my-listings (Protected - Challenge 1)
router.get('/user/my-listings', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const userEmail = req.user!.email;
    const db = getDB();
    let listings: any[];

    if (isMemoryMode()) {
      listings = await db.getCollection('studios').find({ ownerEmail: userEmail }).sort({ createdAt: -1 }).toArray();
    } else {
      listings = await db.collection('studios').find({ ownerEmail: userEmail }).sort({ createdAt: -1 }).toArray();
    }

    return res.status(200).json({
      success: true,
      count: listings.length,
      studios: listings.map(s => ({ ...s, id: s._id.toString() })),
    });
  } catch (error: any) {
    console.error('Error fetching user studio listings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your studio listings.',
    });
  }
});

// GET /api/studios - Search, filter by category, sort
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sortBy, limit } = req.query;
    const db = getDB();

    const query: any = {};

    if (category && category !== 'All' && category !== 'all') {
      query.category = category as string;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: 'i' } },
        { location: { $regex: term, $options: 'i' } },
        { overview: { $regex: term, $options: 'i' } },
        { category: { $regex: term, $options: 'i' } },
      ];
    }

    let sortOption: any = { createdAt: -1 };
    if (sortBy === 'price-asc') sortOption = { hourlyRate: 1 };
    else if (sortBy === 'price-desc') sortOption = { hourlyRate: -1 };
    else if (sortBy === 'rating') sortOption = { rating: -1 };
    else if (sortBy === 'capacity') sortOption = { maxCapacity: -1 };

    let cursor: any;
    if (isMemoryMode()) {
      cursor = db.getCollection('studios').find(query).sort(sortOption);
      if (limit) {
        cursor = cursor.limit(parseInt(limit as string, 10));
      }
    } else {
      cursor = db.collection('studios').find(query).sort(sortOption);
      if (limit) {
        cursor = cursor.limit(parseInt(limit as string, 10));
      }
    }

    const studios = await cursor.toArray();

    return res.status(200).json({
      success: true,
      count: studios.length,
      studios: studios.map((s: any) => ({ ...s, id: s._id.toString() })),
    });
  } catch (error: any) {
    console.error('Error fetching studios:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve workspaces.',
    });
  }
});

// GET /api/studios/:id - Single studio details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    let studio: any = null;

    if (isMemoryMode()) {
      studio = await db.getCollection('studios').findOne({ _id: id });
      if (!studio) {
        studio = await db.getCollection('studios').findOne({ id });
      }
    } else {
      try {
        studio = await db.collection('studios').findOne({ _id: new ObjectId(id) });
      } catch (err) {
        studio = await db.collection('studios').findOne({ id });
      }
    }

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: 'Studio workspace not found.',
      });
    }

    return res.status(200).json({
      success: true,
      studio: { ...studio, id: studio._id.toString() },
    });
  } catch (error: any) {
    console.error('Error fetching studio details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch studio details.',
    });
  }
});

// POST /api/studios - Add New Studio (Private Route - Challenge 1)
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      imageUrl,
      images,
      amenities,
      overview,
    } = req.body;

    if (!title || !category || !hourlyRate || !location || !overview) {
      return res.status(400).json({
        success: false,
        message: 'Title, category, hourly rate, location, and overview are required.',
      });
    }

    const mainImage = imageUrl || (images && images.length > 0 ? images[0] : 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80');
    const imageList = images && images.length > 0 ? images : [mainImage];

    const newStudio = {
      title: title.trim(),
      category,
      hourlyRate: Number(hourlyRate),
      securityDeposit: Number(securityDeposit || 0),
      maxCapacity: Number(maxCapacity || 10),
      location: location.trim(),
      imageUrl: mainImage,
      images: imageList,
      amenities: Array.isArray(amenities) ? amenities : (amenities ? amenities.split(',').map((a: string) => a.trim()) : []),
      overview: overview.trim(),
      rating: 5.0,
      reviewCount: 1,
      ownerEmail: req.user!.email,
      ownerName: req.user!.name,
      ownerPhoto: req.user!.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      featured: false,
      createdAt: new Date().toISOString(),
    };

    const db = getDB();
    let insertedId: any;

    if (isMemoryMode()) {
      const result = await db.getCollection('studios').insertOne(newStudio);
      insertedId = result.insertedId;
    } else {
      const result = await db.collection('studios').insertOne(newStudio);
      insertedId = result.insertedId;
    }

    return res.status(201).json({
      success: true,
      message: 'Workspace listed successfully! Your studio is now live.',
      studio: { ...newStudio, _id: insertedId.toString(), id: insertedId.toString() },
    });
  } catch (error: any) {
    console.error('Error creating studio:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create studio listing.',
    });
  }
});

// PUT/PATCH /api/studios/:id - Update Studio (Private Route - Challenge 1)
router.put('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    let existingStudio: any;

    if (isMemoryMode()) {
      existingStudio = await db.getCollection('studios').findOne({ _id: id }) || await db.getCollection('studios').findOne({ id });
    } else {
      try {
        existingStudio = await db.collection('studios').findOne({ _id: new ObjectId(id) });
      } catch (e) {
        existingStudio = await db.collection('studios').findOne({ id });
      }
    }

    if (!existingStudio) {
      return res.status(404).json({
        success: false,
        message: 'Studio listing not found.',
      });
    }

    // Check ownership
    if (existingStudio.ownerEmail !== req.user!.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only edit your own studio spaces.',
      });
    }

    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      imageUrl,
      images,
      amenities,
      overview,
    } = req.body;

    const updatedData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (title) updatedData.title = title.trim();
    if (category) updatedData.category = category;
    if (hourlyRate !== undefined) updatedData.hourlyRate = Number(hourlyRate);
    if (securityDeposit !== undefined) updatedData.securityDeposit = Number(securityDeposit);
    if (maxCapacity !== undefined) updatedData.maxCapacity = Number(maxCapacity);
    if (location) updatedData.location = location.trim();
    if (imageUrl) updatedData.imageUrl = imageUrl;
    if (images) updatedData.images = images;
    if (amenities) updatedData.amenities = Array.isArray(amenities) ? amenities : amenities.split(',').map((a: string) => a.trim());
    if (overview) updatedData.overview = overview.trim();

    if (isMemoryMode()) {
      await db.getCollection('studios').updateOne({ _id: existingStudio._id }, { $set: updatedData });
    } else {
      await db.collection('studios').updateOne({ _id: existingStudio._id }, { $set: updatedData });
    }

    return res.status(200).json({
      success: true,
      message: 'Studio listing updated successfully!',
      studio: { ...existingStudio, ...updatedData, id: existingStudio._id.toString() },
    });
  } catch (error: any) {
    console.error('Error updating studio:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update studio listing.',
    });
  }
});

// DELETE /api/studios/:id - Delete Studio (Private Route - Challenge 1)
router.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    let existingStudio: any;

    if (isMemoryMode()) {
      existingStudio = await db.getCollection('studios').findOne({ _id: id }) || await db.getCollection('studios').findOne({ id });
    } else {
      try {
        existingStudio = await db.collection('studios').findOne({ _id: new ObjectId(id) });
      } catch (e) {
        existingStudio = await db.collection('studios').findOne({ id });
      }
    }

    if (!existingStudio) {
      return res.status(404).json({
        success: false,
        message: 'Studio listing not found.',
      });
    }

    if (existingStudio.ownerEmail !== req.user!.email) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this listing.',
      });
    }

    if (isMemoryMode()) {
      await db.getCollection('studios').deleteOne({ _id: existingStudio._id });
    } else {
      await db.collection('studios').deleteOne({ _id: existingStudio._id });
    }

    return res.status(200).json({
      success: true,
      message: `Studio "${existingStudio.title}" removed successfully.`,
    });
  } catch (error: any) {
    console.error('Error deleting studio:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete studio listing.',
    });
  }
});

export default router;
