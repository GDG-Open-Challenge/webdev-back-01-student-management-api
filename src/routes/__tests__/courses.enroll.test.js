jest.mock('../../models/Course', () => ({
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const router = require('../courses');
const Course = require('../../models/Course');

const getEnrollHandler = () => {
  const layer = router.stack.find(
    (entry) => entry.route && entry.route.path === '/:id/enroll' && entry.route.methods.post
  );
  return layer.route.stack[0].handle;
};

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('POST /:id/enroll', () => {
  const handler = getEnrollHandler();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns 400 when studentId is missing', async () => {
    const req = { params: { id: 'course-1' }, body: {} };
    const res = createRes();

    await handler(req, res);

    expect(Course.findById).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'studentId is required' });
  });

  test('returns 404 when course is not found', async () => {
    Course.findById.mockResolvedValue(null);
    const req = { params: { id: 'course-1' }, body: { studentId: '65f31d4c9cd393f7a3dbf5a1' } };
    const res = createRes();

    await handler(req, res);

    expect(Course.findById).toHaveBeenCalledWith('course-1');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'Course not found' });
  });

  test('returns 409 when student is already enrolled', async () => {
    Course.findById.mockResolvedValue({
      enrolledStudents: [{ toString: () => '65f31d4c9cd393f7a3dbf5a1' }],
    });
    const req = { params: { id: 'course-1' }, body: { studentId: '65f31d4c9cd393f7a3dbf5a1' } };
    const res = createRes();

    await handler(req, res);

    expect(Course.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'Student already enrolled in this course' });
  });

  test('enrolls student once using $addToSet', async () => {
    Course.findById.mockResolvedValue({
      enrolledStudents: [{ toString: () => '65f31d4c9cd393f7a3dbf5a1' }],
    });
    Course.findByIdAndUpdate.mockResolvedValue({
      enrolledStudents: ['65f31d4c9cd393f7a3dbf5a1', '65f31d4c9cd393f7a3dbf5a2'],
    });
    const req = { params: { id: 'course-1' }, body: { studentId: '65f31d4c9cd393f7a3dbf5a2' } };
    const res = createRes();

    await handler(req, res);

    expect(Course.findByIdAndUpdate).toHaveBeenCalledWith(
      'course-1',
      { $addToSet: { enrolledStudents: '65f31d4c9cd393f7a3dbf5a2' } },
      { new: true }
    );
    expect(res.json).toHaveBeenCalledWith({ message: 'Enrolled successfully', enrolled: 2 });
  });
});
