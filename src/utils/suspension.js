export const isSuspendedOn = (suspensions, studentId, date = new Date()) =>
  suspensions.some(
    (s) =>
      s.status === "active" &&
      s.student_id === studentId &&
      new Date(date) >= new Date(s.start_date) &&
      new Date(date) <= new Date(s.end_date),
  );
