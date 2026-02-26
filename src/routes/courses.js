const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');
const Instructor = require('../models/Faculty');
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  try {
    const semester = req.query.semester || 'Spring 2025';
    const page = parseInt(req.query.page) || 1;
    
    const courses = await Course.find({ semester })
      .populate('faculty', 'name code')
      .skip((page - 1) * 20)
      .limit(20);
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('faculty', 'name code')
      .populate('instructor', 'firstName lastName')
      .populate('enrolledStudents', 'firstName lastName studentId');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { code, title, credits, faculty, capacity, semester, schedule, instructor } = req.body;

     if (instructor && !mongoose.Types.ObjectId.isValid(instructor)) {
      return res.status(400).json({ message: 'Invalid instructor ID format' });
    }

    // Validate instructor existence
    if (instructor) {
      const instructorExists = await Instructor.findById(instructor);
      if (!instructorExists) {
        return res.status(400).json({ message: 'Instructor does not exist' });
      }
    }
    
    
    const course = new Course({
      code: code?.trim(),
      title: title || 'Untitled Course',
      credits: credits || 3,
      faculty,
      instructor,
      capacity: capacity || 50,
      semester: semester || 'Spring 2025',
      schedule,
      enrolledStudents: [],
    });
    
    const saved = await course.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post('/:id/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    course.enrolledStudents.push(studentId);
    
    const updated = await course.save();
    res.json({ message: 'Enrolled successfully', enrolled: updated.enrolledStudents.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/:id/unenroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $pull: { enrolledStudents: studentId } },
      { new: true }
    );
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, credits, capacity, schedule } = req.body;
    
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { title, credits, capacity, schedule },
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
