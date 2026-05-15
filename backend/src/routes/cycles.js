const express = require('express');
const prisma = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticate, requireManager } = require('../middleware/auth');

const router = express.Router();

// Get all review cycles
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;

    const [cycles, total] = await Promise.all([
      prisma.reviewCycle.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.reviewCycle.count({ where })
    ]);

    res.json({
      data: cycles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get cycles error:', error);
    res.status(500).json({ error: 'Failed to fetch review cycles' });
  }
});

// Get single review cycle
router.get('/:id', authenticate, async (req, res) => {
  try {
    const cycle = await prisma.reviewCycle.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Review cycle not found' });
    }

    res.json(cycle);
  } catch (error) {
    console.error('Get cycle error:', error);
    res.status(500).json({ error: 'Failed to fetch review cycle' });
  }
});

// Create review cycle (managers only)
router.post('/', authenticate, requireManager, [
  body('title').trim().notEmpty().withMessage('Cycle title is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, startDate, endDate } = req.body;

    // Validate end date is on or after start date
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    const cycle = await prisma.reviewCycle.create({
      data: {
        title: title.trim(),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'Open',
        createdBy: req.user.id
      },
      include: {
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(cycle);
  } catch (error) {
    console.error('Create cycle error:', error);
    res.status(500).json({ error: 'Failed to create review cycle' });
  }
});

// Transition cycle status
router.patch('/:id/transition', authenticate, requireManager, async (req, res) => {
  try {
    const cycle = await prisma.reviewCycle.findUnique({
      where: { id: req.params.id }
    });

    if (!cycle) {
      return res.status(404).json({ error: 'Review cycle not found' });
    }

    // Only the creator can transition
    if (cycle.createdBy !== req.user.id) {
      return res.status(403).json({ error: 'Only the cycle creator can change its status' });
    }

    // Determine next status
    const transitions = {
      'Open': 'Under Review',
      'Under Review': 'Closed'
    };

    const nextStatus = transitions[cycle.status];
    if (!nextStatus) {
      return res.status(400).json({ error: `Cannot transition from ${cycle.status}` });
    }

    const updatedCycle = await prisma.reviewCycle.update({
      where: { id: req.params.id },
      data: { status: nextStatus },
      include: {
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(updatedCycle);
  } catch (error) {
    console.error('Transition cycle error:', error);
    res.status(500).json({ error: 'Failed to transition review cycle' });
  }
});

module.exports = router;
