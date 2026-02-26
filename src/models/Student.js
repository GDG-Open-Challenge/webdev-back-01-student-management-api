const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      required: [true,'Email is required'],
      trim:true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/,'Please fill valid address'
      ],

    },
    studentId: {
      type: String,
      unique: true,
      required: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
    },
    enrolledCourses: [
      {
        course: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
        grade: String,
      },
    ],
    gpa: {
      type: Number,
      min: 0,
      max: 4.0,
      default: 0,
    },
    enrollmentDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'graduated'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
