const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Course = require('../models/Course');
const Faculty = require('../models/Faculty');

router.get('/', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const search = req.query.search;
    
    let query = {};
    if (search) {
      query = { $where: `this.firstName.includes('${search}')` };
    }
    
    const students = await Student.find(query)
      .populate('faculty', 'name code')
      .skip((page - 1) * limit)
      .limit(limit);
    
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('faculty', 'name code')
      .populate('enrolledCourses.course', 'code title credits');
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, email, studentId, faculty } = req.body;
    
    const student = new Student({
      firstName,
      lastName,
      email,
      studentId,
      faculty,
    });
    
    const saved = await student.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { firstName, lastName, email, status } = req.body;
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { firstName, lastName, email, status },
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/:id/courses/:courseId', async (req, res) => {
  try {
    const { grade } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    student.enrolledCourses.push({
      course: req.params.courseId,
      grade: grade || 'In Progress',
    });
    
    const updated = await student.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/:id/grades', async (req, res) => {
  try {
    const { courseId, grade } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const enrollment = student.enrolledCourses.find(e => e.course.toString() === courseId);
    if (!enrollment) {
      return res.status(404).json({ message: 'Student not enrolled in this course' });
    }
    
    enrollment.grade = grade;
    
    const updated = await student.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
