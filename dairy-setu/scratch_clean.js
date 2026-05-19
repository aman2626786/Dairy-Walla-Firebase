const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server.ts');
let content = fs.readFileSync(filePath, 'utf8');

const target = `// Delivery groups
app.get('/api/delivery-groups/:distributorId', async (req, res) => {
  try {
    const requester = await requireRequesterProfile(req, res);
    if (!requester) return;
    if (requester.role !== 'distributor') {
      return res.status(403).json({ error: 'Only distributor accounts can access delivery groups.' });
    }
    const ownDp = await prisma.distributorProfile.findUnique({ where: { userId: requester.id } });
    if (!ownDp || ownDp.id !== req.params.distributorId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(await prisma.deliveryGroup.findMany({ where: { distributorId: req.params.distributorId } }));
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});
app.post('/api/delivery-groups', async (req, res) => {
  try {
    const requester = await requireRequesterProfile(req, res);
    if (!requester) return;
    if (requester.role !== 'distributor') {
      return res.status(403).json({ error: 'Only distributor accounts can create delivery groups.' });
    }
    const ownDp = await prisma.distributorProfile.findUnique({ where: { userId: requester.id } });
    if (!ownDp || ownDp.id !== req.body.distributorId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(await prisma.deliveryGroup.create({ data: req.body }));
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});
app.delete('/api/delivery-groups/:id', async (req, res) => {
  try {
    const requester = await requireRequesterProfile(req, res);
    if (!requester) return;
    if (requester.role !== 'distributor') {
      return res.status(403).json({ error: 'Only distributor accounts can delete delivery groups.' });
    }
    }
    return res.json(updated);
  } catch (e) {
    console.error('Payment status update error:', e);
    return res.status(500).json({ error: 'Payment update failed' });
  }
});`;

// Normalize line endings to find it properly
const cleanString = (str) => str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

let cleanedContent = cleanString(content);
const cleanedTarget = cleanString(target);

const index = cleanedContent.indexOf(cleanedTarget);
if (index !== -1) {
  cleanedContent = cleanedContent.substring(0, index) + cleanedContent.substring(index + cleanedTarget.length);
  fs.writeFileSync(filePath, cleanedContent, 'utf8');
  console.log('SUCCESS: Successfully cleaned server.ts!');
} else {
  console.log('ERROR: Target block not found. Checking if it was already removed.');
}
