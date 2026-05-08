import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// 1. Get or Verify User Profile
app.post('/api/auth/me', async (req, res) => {
  const { phone, role } = req.body; // Role added to check for conflicts
  try {
    let profile = await prisma.profile.findFirst({ where: { phone } });
    if (!profile) {
      return res.json({ needsSetup: true });
    }

    // CRITICAL: Check if user is trying to log in with a different role
    if (role && profile.role !== role) {
      return res.status(409).json({ 
        error: `This number is already registered as a ${profile.role}. Please log in with the correct role.` 
      });
    }

    const dp = await prisma.distributorProfile.findUnique({ where: { userId: profile.id } });
    const sp = await prisma.shopkeeperProfile.findUnique({ where: { userId: profile.id } });
    
    res.json({ profile, dp, sp });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Setup Profile
app.post('/api/auth/setup', async (req, res) => {
  const { phone, role, name, businessData, shopData } = req.body;
  try {
    let profile = await prisma.profile.findFirst({ where: { phone } });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { phone, role, name, email: `${phone}@dairy.local` }
      });
    } else {
      if (profile.role !== role) {
        return res.status(409).json({ error: `Cannot change role. This number is already registered as a ${profile.role}.` });
      }
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: { name }
      });
    }

    if (role === 'distributor' && businessData) {
      const code = `${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      await prisma.distributorProfile.upsert({
        where: { userId: profile.id },
        update: { ...businessData },
        create: { userId: profile.id, connectionCode: code, ...businessData }
      });
    } else if (role === 'shopkeeper' && shopData) {
      await prisma.shopkeeperProfile.upsert({
        where: { userId: profile.id },
        update: { ...shopData },
        create: { userId: profile.id, ...shopData }
      });
    }
    res.json({ success: true, profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during setup' });
  }
});

// 3. Delete Profile
app.delete('/api/auth/me/:phone', async (req, res) => {
  try {
    await prisma.profile.deleteMany({ where: { phone: req.params.phone } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during delete' });
  }
});

// 4. Update Profile Name
app.patch('/api/auth/user/:id', async (req, res) => {
  try {
    await prisma.profile.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// --- Phase 2: App Data Routes ---

// Profiles
app.get('/api/profiles/distributor/:userId', async (req, res) => {
  try {
    const dp = await prisma.distributorProfile.findUnique({ where: { userId: req.params.userId }, include: { user: true } });
    if (!dp) return res.status(404).json({ error: 'Not found' });
    res.json({ ...dp, phone: dp.user.phone, email: dp.user.email });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/profiles/shopkeeper/:userId', async (req, res) => {
  try {
    const sp = await prisma.shopkeeperProfile.findUnique({ where: { userId: req.params.userId }, include: { user: true } });
    if (!sp) return res.status(404).json({ error: 'Not found' });
    res.json({ ...sp, phone: sp.user.phone, email: sp.user.email });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/profiles/shopkeeper-by-id/:id', async (req, res) => {
  try {
    const sp = await prisma.shopkeeperProfile.findUnique({ where: { id: req.params.id }, include: { user: true } });
    if (!sp) return res.status(404).json({ error: 'Not found' });
    res.json({ ...sp, phone: sp.user.phone, email: sp.user.email });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/distributors', async (req, res) => {
  try {
    const dps = await prisma.distributorProfile.findMany({ include: { user: true } });
    res.json(dps.map(dp => ({ ...dp, phone: dp.user.phone, email: dp.user.email })));
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.patch('/api/profiles/distributor/:id', async (req, res) => {
  try {
    const updated = await prisma.distributorProfile.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.patch('/api/profiles/shopkeeper/:id', async (req, res) => {
  try {
    const updated = await prisma.shopkeeperProfile.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Connections
app.get('/api/connections/:role/:userId', async (req, res) => {
  try {
    const { role, userId } = req.params;
    if (role === 'distributor') {
      const dp = await prisma.distributorProfile.findUnique({ where: { userId } });
      if (!dp) return res.json([]);
      res.json(await prisma.connection.findMany({ where: { distributorId: dp.id } }));
    } else {
      const sp = await prisma.shopkeeperProfile.findUnique({ where: { userId } });
      if (!sp) return res.json([]);
      res.json(await prisma.connection.findMany({ where: { shopkeeperId: sp.id } }));
    }
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/connections', async (req, res) => {
  try {
    const { shopkeeperId, shopkeeperName, shopName, distributorCode, shopkeeperPhone } = req.body;
    const dp = await prisma.distributorProfile.findUnique({ where: { connectionCode: distributorCode } });
    if (!dp) return res.status(404).json({ error: 'Invalid code' });
    const conn = await prisma.connection.create({
      data: {
        shopkeeperId, shopkeeperName, shopName, shopkeeperPhone,
        distributorId: dp.id, distributorName: dp.ownerName || '', businessName: dp.businessName,
        status: 'pending', autoOrderEnabled: false
      }
    });
    res.json({ connection: conn, distributorUserId: dp.userId });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.patch('/api/connections/:id', async (req, res) => {
  try { res.json(await prisma.connection.update({ where: { id: req.params.id }, data: req.body })); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Products
app.get('/api/products/:distributorId', async (req, res) => {
  try { res.json(await prisma.product.findMany({ where: { distributorId: req.params.distributorId } })); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
app.post('/api/products', async (req, res) => {
  try { res.json(await prisma.product.create({ data: req.body })); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
app.patch('/api/products/:id', async (req, res) => {
  try { res.json(await prisma.product.update({ where: { id: req.params.id }, data: req.body })); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
app.delete('/api/products/:id', async (req, res) => {
  try { await prisma.product.delete({ where: { id: req.params.id } }); res.json({ success: true }); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Orders
app.get('/api/orders/:role/:userId', async (req, res) => {
  try {
    const { role, userId } = req.params;
    const dp = role === 'distributor' ? await prisma.distributorProfile.findUnique({ where: { userId } }) : null;
    const sp = role === 'shopkeeper' ? await prisma.shopkeeperProfile.findUnique({ where: { userId } }) : null;
    const profileId = dp?.id || sp?.id;
    if (!profileId) return res.json([]);

    const field = role === 'distributor' ? 'distributorId' : 'shopkeeperId';
    res.json(await prisma.order.findMany({ where: { [field]: profileId }, include: { items: true }, orderBy: { placedAt: 'desc' } }));
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { shopkeeperId, shopkeeperName, shopName, distributorId, items, isLate, total } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const order = await prisma.order.create({
      data: {
        shopkeeperId, shopkeeperName, shopName, distributorId, type: isLate ? 'late' : 'normal', status: isLate ? 'pending' : 'accepted', source: 'web', deliveryDate: new Date(today), total,
        items: { create: items.map((i: any) => ({ productId: i.product.id, productName: i.product.name, brand: i.product.brand, unit: i.product.unit, unitPrice: i.product.price, quantity: i.quantity })) }
      },
      include: { items: true }
    });
    const dp = await prisma.distributorProfile.findUnique({ where: { id: distributorId }});
    res.json({ order, distributorUserId: dp?.userId });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.patch('/api/orders/:id', async (req, res) => {
  try { res.json(await prisma.order.update({ where: { id: req.params.id }, data: req.body })); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Delivery Groups
app.get('/api/delivery-groups/:distributorId', async (req, res) => {
  try { res.json(await prisma.deliveryGroup.findMany({ where: { distributorId: req.params.distributorId }})); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
app.post('/api/delivery-groups', async (req, res) => {
  try { res.json(await prisma.deliveryGroup.create({ data: req.body })); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
app.delete('/api/delivery-groups/:id', async (req, res) => {
  try { await prisma.deliveryGroup.delete({ where: { id: req.params.id }}); res.json({ success: true }); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Notifications
app.get('/api/notifications/:userId', async (req, res) => {
  try { res.json(await prisma.notification.findMany({ where: { userId: req.params.userId }, orderBy: { createdAt: 'desc' } })); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
app.post('/api/notifications', async (req, res) => {
  try { res.json(await prisma.notification.create({ data: req.body })); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
app.patch('/api/notifications/:id/read', async (req, res) => {
  try { res.json(await prisma.notification.update({ where: { id: req.params.id }, data: { read: true }})); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});
app.patch('/api/notifications/user/:userId/read-all', async (req, res) => {
  try { await prisma.notification.updateMany({ where: { userId: req.params.userId }, data: { read: true }}); res.json({ success: true }); } 
  catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Auto orders
app.post('/api/auto-orders/:distributorUserId', async (req, res) => {
  try {
    const dp = await prisma.distributorProfile.findUnique({ where: { userId: req.params.distributorUserId }});
    if (!dp) return res.status(404).json({ error: 'Not found' });
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date(todayStr);
    const activeConns = await prisma.connection.findMany({ where: { distributorId: dp.id, status: 'active', autoOrderEnabled: true } });
    for (const conn of activeConns) {
      const todayOrderCount = await prisma.order.count({ where: { shopkeeperId: conn.shopkeeperId!, distributorId: conn.distributorId!, deliveryDate: today } });
      if (todayOrderCount > 0) continue;
      const lastOrder = await prisma.order.findFirst({ where: { shopkeeperId: conn.shopkeeperId!, distributorId: conn.distributorId! }, orderBy: { placedAt: 'desc' }, include: { items: true } });
      if (!lastOrder) continue;
      const validItems = lastOrder.items.filter(i => (i.quantity || 0) > 0);
      if (validItems.length === 0) continue;
      const total = validItems.reduce((sum, item) => sum + Number(item.unitPrice || 0) * (item.quantity || 0), 0);
      await prisma.order.create({
        data: {
          shopkeeperId: conn.shopkeeperId, shopkeeperName: conn.shopkeeperName, shopName: conn.shopName, distributorId: conn.distributorId, type: 'normal', status: 'pending', source: 'web', deliveryDate: today, total,
          items: { create: validItems.map(i => ({ productId: i.productId, productName: i.productName, brand: i.brand, unit: i.unit, unitPrice: i.unitPrice, quantity: i.quantity })) }
        }
      });
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Backend API Server running on http://localhost:${PORT}`);
});