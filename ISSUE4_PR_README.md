## 🐛 Bug Fix: Issue #4 — Duplicate Student Enrollment

### 📌 Summary

| Field | Details |
|---|---|
| **Issue** | #4 |
| **Title** | Duplicate Student Enrollment |
| **Severity** | 🔴 High |
| **Category** | Bug / Data Integrity |
| **File(s)** | `src/routes/courses.js`, `src/routes/__tests__/courses.enroll.test.js` |
| **Function(s)** | `router.post('/:id/enroll', ...)` |

---

### 🔍 Bug Description

The enroll endpoint allowed the same student to be added to `enrolledStudents` multiple times.  
This caused duplicate roster entries and incorrect enrollment counts.

**Steps to Reproduce:**
1. `POST /api/courses/{courseId}/enroll` with `{"studentId":"<same-id>"}`.
2. Repeat the same request with the same `studentId`.
3. `GET /api/courses/{courseId}` and check `enrolledStudents`.

**Expected Behavior:**  
Second enrollment is rejected, and student appears only once.

**Actual Behavior:**  
Second enrollment succeeds, and the same student appears multiple times.

---

### 🔬 Root Cause Analysis

The route used `course.enrolledStudents.push(studentId)` with no duplicate check.  
`push()` always appends, so duplicate IDs were stored. Also, simple read-then-save is vulnerable to race conditions for uniqueness.

---

### ✅ Fix Applied

I made enrollment idempotent and duplicate-safe by:

1. Adding `studentId` required validation (`400`).
2. Checking existing enrollment and returning `409` if already enrolled.
3. Using MongoDB `$addToSet` (instead of `push`) so DB update only adds when value is not already present.

This resolves both the immediate duplicate bug and improves safety under concurrent requests.

---

### 📄 Code Changes

#### Before (Buggy Code)

```js
// File: src/routes/courses.js
// Line(s): around old enroll handler
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
```

#### After (Fixed Code)

```js
// File: src/routes/courses.js
// Line(s): 62-94
router.post('/:id/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    if (!studentId) {
      return res.status(400).json({ message: 'studentId is required' });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const alreadyEnrolled = course.enrolledStudents.some(
      (enrolledStudentId) => enrolledStudentId.toString() === studentId
    );

    if (alreadyEnrolled) {
      return res.status(409).json({ message: 'Student already enrolled in this course' });
    }

    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { enrolledStudents: studentId } },
      { new: true }
    );

    res.json({ message: 'Enrolled successfully', enrolled: updated.enrolledStudents.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
```

---

### 🧪 Verification

- Added tests in `src/routes/__tests__/courses.enroll.test.js`.
- Verified cases:
1. Missing `studentId` -> `400`
2. Missing course -> `404`
3. Duplicate enrollment -> `409`
4. New enrollment uses `$addToSet` and succeeds
