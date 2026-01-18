const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const LessonProgress = require("../models/LessonProgress");

async function updateCourseProgress(userId, courseId) {
  // 🧩 Count only active (non-archived) lessons
  const totalLessons = await Lesson.countDocuments({
    courseId,
    isArchived: { $ne: true }  // count lessons that aren't archived
  });

  // 🧩 Count completed lessons for this specific course
  const completedLessons = await LessonProgress.countDocuments({
    userId,
    courseId,
    isCompleted: true
  });

  // 🧮 Calculate safe percentage
  const progress =
    totalLessons > 0
      ? Math.min(Math.round((completedLessons / totalLessons) * 100), 100)
      : 0;

  // 💾 Update enrollment
  await Enrollment.findOneAndUpdate(
    { userId, courseId },
    { progress },
    { new: true}
  );

  return progress;
}

module.exports = { updateCourseProgress };
