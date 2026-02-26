const Student = require('../Student');

describe('Student model email validation', () => {
  const buildStudent = (email) =>
    new Student({
      firstName: 'Jane',
      lastName: 'Doe',
      email,
      studentId: `S-${Math.random().toString(36).slice(2, 8)}`,
    });

  test('accepts a valid email', () => {
    const student = buildStudent('student@example.com');
    const error = student.validateSync();

    expect(error).toBeUndefined();
  });

  test.each(['notanemail', '@domain.com', 'user@', 'user @domain.com'])(
    'rejects invalid email: %s',
    (invalidEmail) => {
      const student = buildStudent(invalidEmail);
      const error = student.validateSync();

      expect(error).toBeDefined();
      expect(error.errors.email).toBeDefined();
    }
  );
});
