const express = require('express');
const prisma = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const VALID_GOAL_STATUSES = ['Not Started', 'In Progress', 'Completed'];

router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, cycleId, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (req.user.role === 'manager') {
      const directReports = await prisma.user.findMany({
        where: { managerId: req.user.id },
        select: { id: true }
      });
      const reportIds = directReports.map(r => r.id);
      where.employeeId = { in: [req.user.id, ...reportIds] };
    } else {
      where.employeeId = req.user.id;
    }

    if (cycleId) where.reviewCycleId = cycleId;
    if (status) where.status = status;

    const validSortFields = ['title', 'createdAt', 'status'];
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        include: {
          employee: { select: { id: true, name: true, email: true } },
          reviewCycle: { select: { id: true, title: true, status: true } }
        },
        orderBy: { [orderField]: orderDirection },
        skip,
        take: parseInt(limit)
      }),
      prisma.goal.count({ where })
    ]);

    res.json({
      data: goals,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        reviewCycle: { select: { id: true, title: true, status: true } }
      }
    });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    if (goal.employeeId !== req.user.id) {
      if (req.user.role === 'manager') {
        const employee = await prisma.user.findUnique({ where: { id: goal.employeeId } });
        if (employee.managerId !== req.user.id) return res.status(403).json({ error: 'Access denied' });
      } else {
        return res.status(403).json({ error: 'Access denied' });
      }
    }
    res.json(goal);
  } catch (error) {
    console.error('Get goal error:', error);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

router.post('/', authenticate, [
  body('title').trim().notEmpty().withMessage('Goal title is required'),
  body('description').optional(),
  body('reviewCycleId').notEmpty().withMessage('Review cycle is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, description, reviewCycleId } = req.body;
    const cycle = await prisma.reviewCycle.findUnique({ where: { id: reviewCycleId } });
    if (!cycle) return res.status(404).json({ error: 'Review cycle not found' });
    if (cycle.status !== 'Open') return res.status(400).json({ error: 'Goals can only be created in Open cycles' });

    const goal = await prisma.goal.create({
      data: { title: title.trim(), description: description?.trim() || null, status: 'Not Started', employeeId: req.user.id, reviewCycleId },
      include: { employee: { select: { id: true, name: true, email: true } }, reviewCycle: { select: { id: true, title: true, status: true } } }
    });
    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

router.put('/:id', authenticate, [
  body('title').optional().trim().notEmpty().withMessage('Goal title cannot be empty'),
  body('description').optional(),
  body('status').optional().isIn(VALID_GOAL_STATUSES).withMessage('Invalid goal status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const goal = await prisma.goal.findUnique({ where: { id: req.params.id }, include: { reviewCycle: true } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.employeeId !== req.user.id) return res.status(403).json({ error: 'You can only edit your own goals' });
    if (goal.reviewCycle.status !== 'Open') return res.status(400).json({ error: 'Goals can only be edited in Open cycles' });

    const { title, description, status } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) updateData.status = status;

    const updatedGoal = await prisma.goal.update({
      where: { id: req.params.id },
      data: updateData,
      include: { employee: { select: { id: true, name: true, email: true } }, reviewCycle: { select: { id: true, title: true, status: true } } }
    });
    res.json(updatedGoal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const goal = await prisma.goal.findUnique({ where: { id: req.params.id }, include: { reviewCycle: true } });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    if (goal.employeeId !== req.user.id) return res.status(403).json({ error: 'You can only delete your own goals' });
    if (goal.reviewCycle.status !== 'Open') return res.status(400).json({ error: 'Goals can only be deleted in Open cycles' });

    await prisma.goal.delete({ where: { id: req.params.id } });
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;
