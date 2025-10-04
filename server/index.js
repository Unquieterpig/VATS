const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Data file path
const DATA_FILE = path.join(__dirname, 'data', 'headsets.json');

// Default priority order: smaller number = higher priority
const DEFAULT_PRIORITY = { "Quest3": 1, "Quest2": 2, "HTC_Vive_XR": 3 };

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Load data from file
async function loadData() {
  try {
    await fs.access(DATA_FILE);
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    // Create sample data if file doesn't exist
    const sampleData = [
      {
        "id": "Quest3-001",
        "model": "Quest3",
        "account_id": "demo_account_1",
        "last_used": new Date().toISOString(),
        "in_use": false,
      },
      {
        "id": "Quest2-001", 
        "model": "Quest2",
        "account_id": "demo_account_2",
        "last_used": new Date().toISOString(),
        "in_use": false,
      },
      {
        "id": "HTC-001",
        "model": "HTC_Vive_XR",
        "account_id": "demo_account_3", 
        "last_used": new Date().toISOString(),
        "in_use": false,
      },
    ];
    await saveData(sampleData);
    return sampleData;
  }
}

// Save data to file
async function saveData(data) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Helper functions
function getUsedAccounts(headsets) {
  return new Set(headsets.filter(h => h.in_use).map(h => h.account_id));
}

function getPriority(headset) {
  if (headset.custom_priority !== undefined) {
    return headset.custom_priority;
  }
  return DEFAULT_PRIORITY[headset.model] || 999;
}

function suggestHeadset(headsets) {
  const usedAccounts = getUsedAccounts(headsets);
  
  const available = headsets.filter(h => 
    !h.in_use && !usedAccounts.has(h.account_id)
  );

  if (available.length === 0) {
    return null;
  }

  available.sort((a, b) => {
    const priorityA = getPriority(a);
    const priorityB = getPriority(b);
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    return new Date(a.last_used) - new Date(b.last_used);
  });

  return available[0];
}

// API Routes

// Get all headsets
app.get('/api/headsets', async (req, res) => {
  try {
    const headsets = await loadData();
    const hideAccountInUse = req.query.hide_account_in_use === 'true';
    
    let filteredHeadsets = headsets;
    if (hideAccountInUse) {
      const usedAccounts = getUsedAccounts(headsets);
      filteredHeadsets = headsets.filter(h => 
        !(usedAccounts.has(h.account_id) && !h.in_use)
      );
    }

    const suggestion = suggestHeadset(headsets);
    
    res.json({
      headsets: filteredHeadsets,
      suggestion: suggestion,
      usedAccounts: Array.from(getUsedAccounts(headsets))
    });
  } catch (error) {
    console.error('Error loading headsets:', error);
    res.status(500).json({ error: 'Failed to load headsets' });
  }
});

// Get suggestion only
app.get('/api/suggestion', async (req, res) => {
  try {
    const headsets = await loadData();
    const suggestion = suggestHeadset(headsets);
    res.json({ suggestion });
  } catch (error) {
    console.error('Error getting suggestion:', error);
    res.status(500).json({ error: 'Failed to get suggestion' });
  }
});

// Checkout headsets
app.post('/api/checkout', async (req, res) => {
  try {
    const { headsetIds } = req.body;
    if (!Array.isArray(headsetIds) || headsetIds.length === 0) {
      return res.status(400).json({ error: 'Invalid headset IDs' });
    }

    const headsets = await loadData();
    const usedAccounts = getUsedAccounts(headsets);
    
    const errors = [];
    const successful = [];

    for (const headsetId of headsetIds) {
      const headset = headsets.find(h => h.id === headsetId);
      if (!headset) {
        errors.push(`Headset ${headsetId} not found`);
        continue;
      }

      if (headset.in_use) {
        errors.push(`Headset ${headsetId} is already in use`);
        continue;
      }

      if (usedAccounts.has(headset.account_id)) {
        errors.push(`Account ${headset.account_id} already in use! Can't use ${headsetId}`);
        continue;
      }

      headset.in_use = true;
      headset.last_used = new Date().toISOString();
      successful.push(headsetId);
      usedAccounts.add(headset.account_id);
    }

    if (successful.length > 0) {
      await saveData(headsets);
    }

    res.json({ 
      successful, 
      errors,
      message: `Successfully checked out ${successful.length} headset(s)`
    });
  } catch (error) {
    console.error('Error checking out headsets:', error);
    res.status(500).json({ error: 'Failed to checkout headsets' });
  }
});

// Return headsets
app.post('/api/return', async (req, res) => {
  try {
    const { headsetIds } = req.body;
    if (!Array.isArray(headsetIds) || headsetIds.length === 0) {
      return res.status(400).json({ error: 'Invalid headset IDs' });
    }

    const headsets = await loadData();
    const successful = [];

    for (const headsetId of headsetIds) {
      const headset = headsets.find(h => h.id === headsetId);
      if (headset && headset.in_use) {
        headset.in_use = false;
        successful.push(headsetId);
      }
    }

    if (successful.length > 0) {
      await saveData(headsets);
    }

    res.json({ 
      successful,
      message: `Successfully returned ${successful.length} headset(s)`
    });
  } catch (error) {
    console.error('Error returning headsets:', error);
    res.status(500).json({ error: 'Failed to return headsets' });
  }
});

// Add headset
app.post('/api/headsets', async (req, res) => {
  try {
    const { id, model, account_id } = req.body;
    
    if (!id || !model || !account_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const headsets = await loadData();
    
    // Check for duplicate ID
    if (headsets.find(h => h.id === id)) {
      return res.status(400).json({ error: `Headset ID '${id}' already exists` });
    }

    const newHeadset = {
      id,
      model,
      account_id,
      last_used: new Date().toISOString(),
      in_use: false
    };

    headsets.push(newHeadset);
    await saveData(headsets);

    res.status(201).json({ 
      headset: newHeadset,
      message: `Headset '${id}' added successfully`
    });
  } catch (error) {
    console.error('Error adding headset:', error);
    res.status(500).json({ error: 'Failed to add headset' });
  }
});

// Update headset
app.put('/api/headsets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { model, account_id, custom_priority } = req.body;
    
    if (!model || !account_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const headsets = await loadData();
    const headsetIndex = headsets.findIndex(h => h.id === id);
    
    if (headsetIndex === -1) {
      return res.status(404).json({ error: 'Headset not found' });
    }

    const headset = headsets[headsetIndex];
    
    if (headset.in_use) {
      return res.status(400).json({ 
        error: `Cannot edit headset '${id}' while it's in use`
      });
    }

    // Update headset
    headset.model = model;
    headset.account_id = account_id;
    if (custom_priority !== undefined) {
      headset.custom_priority = custom_priority;
    }

    await saveData(headsets);

    res.json({ 
      headset,
      message: `Headset '${id}' updated successfully`
    });
  } catch (error) {
    console.error('Error updating headset:', error);
    res.status(500).json({ error: 'Failed to update headset' });
  }
});

// Delete headset
app.delete('/api/headsets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const headsets = await loadData();
    const headsetIndex = headsets.findIndex(h => h.id === id);
    
    if (headsetIndex === -1) {
      return res.status(404).json({ error: 'Headset not found' });
    }

    const headset = headsets[headsetIndex];
    
    if (headset.in_use) {
      return res.status(400).json({ 
        error: `Cannot remove headset '${id}' while it's in use`
      });
    }

    headsets.splice(headsetIndex, 1);
    await saveData(headsets);

    res.json({ message: `Headset '${id}' removed successfully` });
  } catch (error) {
    console.error('Error deleting headset:', error);
    res.status(500).json({ error: 'Failed to delete headset' });
  }
});

// Set priority
app.put('/api/headsets/:id/priority', async (req, res) => {
  try {
    const { id } = req.params;
    const { priority } = req.body;
    
    if (typeof priority !== 'number' || priority < 1 || priority > 100) {
      return res.status(400).json({ error: 'Priority must be a number between 1 and 100' });
    }

    const headsets = await loadData();
    const headset = headsets.find(h => h.id === id);
    
    if (!headset) {
      return res.status(404).json({ error: 'Headset not found' });
    }

    headset.custom_priority = priority;
    await saveData(headsets);

    res.json({ 
      headset,
      message: `Priority for headset '${id}' set to ${priority}`
    });
  } catch (error) {
    console.error('Error setting priority:', error);
    res.status(500).json({ error: 'Failed to set priority' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`VATS server running on port ${PORT}`);
});
