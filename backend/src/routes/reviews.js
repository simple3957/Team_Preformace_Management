const express = require('express');
const prisma = require('../db');
const { body, validationResult } = require('express-validator');
const { authenticate, requireManager } = require('../middleware/auth');

const router = express.Router();

// Get reviews
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, cycleId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (req.user.role === 'manager') {
      where.OR = [
        { managerId: req.user.id },
        { employeeId: req.user.id }
      ];
    } else {
      where.employeeId = req.user.id;
    }

    if (cycleId) where.reviewCycleId = cycleId;
    if (status) where.status = status;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          employee: { select: { id: true, name: true, email: true } },
          manager: { select: { id: true, name: true, email: true } },
          reviewCycle: { select: { id: true, title: true, status: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.review.count({ where })
    ]);

    const sanitizedReviews = reviews.map(review => {
      if (review.employeeId === req.user.id && review.status !== 'Finalized') {
        return { ...review, managerAssessmentText: null, rating: null };
      }
      return review;
    });

    res.json({
      data: sanitizedReviews,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get single review
router.get('/:id', authenticate, async (req, res) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: req.params.id },
      include: {
        employee: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
        reviewCycle: { select: { id: true, title: true, status: true } }
      }
    });

    if (!review) return res.status(404).json({ error: 'Review not found' });
    if (review.employeeId !== req.user.id && review.managerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (review.employeeId === req.user.id && review.status !== 'Finalized') {
      review.managerAssessmentText = null;
      review.rating = null;
    }
    res.json(review);
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ error: 'Failed to fetch review' });
  }
});

// Submit self-assessment
router.post('/self-assessment', authenticate, [
  body('reviewCycleId').notEmpty().withMessage('Review cycle is required'),
  body('selfAssessmentText').trim().notEmpty().withMessage('Self-assessment text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { reviewCycleId, selfAssessmentText } = req.body;

    const cycle = await prisma.reviewCycle.findUnique({ where: { id: reviewCycleId } });
    if (!cycle) return res.status(404).json({ error: 'Review cycle not found' });
    if (cycle.status !== 'Under Review') {
      return res.status(400).json({ error: 'Self-assessments can only be submitted during Under Review phase' });
    }

    let review = await prisma.review.findUnique({
      where: { employeeId_reviewCycleId: { employeeId: req.user.id, reviewCycleId } }
    });

    if (review) {
      if (review.status === 'Finalized') {
        return res.status(400).json({ error: 'Cannot edit self-assessment after review is finalized' });
      }
      review = await prisma.review.update({
        where: { id: review.id },
        data: { selfAssessmentText: selfAssessmentText.trim(), selfAssessmentSubmittedAt: new Date() },
        include: {
          employee: { select: { id: true, name: true, email: true } },
          manager: { select: { id: true, name: true, email: true } },
          reviewCycle: { select: { id: true, title: true, status: true } }
        }
      });
    } else {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user.managerId) return res.status(400).json({ error: 'No manager assigned. Cannot create review.' });

      review = await prisma.review.create({
        data: {
          employeeId: req.user.id,
          managerId: user.managerId,
          reviewCycleId,
          selfAssessmentText: selfAssessmentText.trim(),
          selfAssessmentSubmittedAt: new Date(),
          status: 'Pending'
        },
        include: {
          employee: { select: { id: true, name: true, email: true } },
          manager: { select: { id: true, name: true, email: true } },
          reviewCycle: { select: { id: true, title: true, status: true } }
        }
      });
    }
    res.json(review);
  } catch (error) {
    console.error('Submit self-assessment error:', error);
    res.status(500).json({ error: 'Failed to submit self-assessment' });
  }
});

// Manager finalize review
router.post('/finalize', authenticate, requireManager, [
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('reviewCycleId').notEmpty().withMessage('Review cycle is required'),
  body('managerAssessmentText').trim().notEmpty().withMessage('Manager assessment text is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { employeeId, reviewCycleId, managerAssessmentText, rating } = req.body;

    const cycle = await prisma.reviewCycle.findUnique({ where: { id: reviewCycleId } });
    if (!cycle) return res.status(404).json({ error: 'Review cycle not found' });
    if (cycle.status !== 'Under Review') {
      return res.status(400).json({ error: 'Reviews can only be submitted during Under Review phase' });
    }

    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });
    if (employee.managerId !== req.user.id) {
      return res.status(403).json({ error: 'You can only review your direct reports' });
    }

    let review = await prisma.review.findUnique({
      where: { employeeId_reviewCycleId: { employeeId, reviewCycleId } }
    });

    const reviewData = {
      managerAssessmentText: managerAssessmentText.trim(),
      rating: parseInt(rating),
      status: 'Finalized',
      finalizedAt: new Date()
    };

    if (review) {
      if (review.status === 'Finalized') return res.status(400).json({ error: 'Review has already been finalized' });
      review = await prisma.review.update({
        where: { id: review.id },
        data: reviewData,
        include: {
          employee: { select: { id: true, name: true, email: true } },
          manager: { select: { id: true, name: true, email: true } },
          reviewCycle: { select: { id: true, title: true, status: true } }
        }
      });
    } else {
      review = await prisma.review.create({
        data: { employeeId, managerId: req.user.id, reviewCycleId, ...reviewData },
        include: {
          employee: { select: { id: true, name: true, email: true } },
          manager: { select: { id: true, name: true, email: true } },
          reviewCycle: { select: { id: true, title: true, status: true } }
        }
      });
    }
    res.json(review);
  } catch (error) {
    console.error('Finalize review error:', error);
    res.status(500).json({ error: 'Failed to finalize review' });
  }
});

// Get direct reports for a manager
router.get('/direct-reports/list', authenticate, requireManager, async (req, res) => {
  try {
    const directReports = await prisma.user.findMany({
      where: { managerId: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(directReports);
  } catch (error) {
    console.error('Get direct reports error:', error);
// Get aggregated stats for manager dashboard
router.get('/stats/summary', authenticate, requireManager, async (req, res) => {
  try {
    const directReports = await prisma.user.findMany({
      where: { managerId: req.user.id },
      select: { id: true, name: true }
    });

    const reportIds = directReports.map(r => r.id);

    const reviews = await prisma.review.findMany({
      where: { employeeId: { in: reportIds } },
      include: {
        reviewCycle: { select: { title: true, startDate: true } },
        employee: { select: { name: true } }
      }
    });

    const stats = {
      pending: reviews.filter(r => r.status === 'Pending').length,
      finalized: reviews.filter(r => r.status === 'Finalized').length,
      totalReports: reportIds.length,
      historicalRatings: reviews
        .filter(r => r.status === 'Finalized')
        .map(r => ({
          employeeName: r.employee.name,
          cycleTitle: r.reviewCycle.title,
          rating: r.rating,
          date: r.finalizedAt
        }))
    };

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
