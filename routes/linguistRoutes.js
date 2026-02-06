const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const { isAdminOrLinguist } = require('../middleware/auth');

const modelMap = {
  course: Course,
  lesson: Lesson,
  quiz: Quiz
};

// 📘 Review dashboard
router.get('/linguist/review', isAdminOrLinguist, async (req, res) => {
  try {
    const courses = await Course.find({ reviewStatus: 'pending' }).lean();
    const lessons = await Lesson.find({ reviewStatus: 'pending' }).lean();
    const quizzes = await Quiz.find({ reviewStatus: 'pending' }).lean();

    res.render('linguist/reviewDashboard', {
      pageTitle: "Content Review",
      courses,
      lessons,
      quizzes,
      counts: {
        courses: courses.length,
        lessons: lessons.length,
        quizzes: quizzes.length
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});


// ✅ Approve
router.post('/linguist/review/:type/:id/approve', isAdminOrLinguist, async (req, res) => {
  try {
    const { type, id } = req.params;
    const Model = modelMap[type];
    if (!Model) return res.status(400).send("Invalid review type");

    await Model.findOneAndUpdate(
      { _id: id, reviewStatus: 'pending' },
      {
        reviewStatus: 'approved',
        reviewedBy: req.session.user._id,
        reviewedAt: new Date(),
        reviewNotes: ""
      }
    );

    res.redirect('/linguist/review');
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).send("Approval failed");
  }
});

// ❌ Reject
router.post('/linguist/review/:type/:id/reject', isAdminOrLinguist, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { notes } = req.body;
    const Model = modelMap[type];
    if (!Model) return res.status(400).send("Invalid review type");

    await Model.findOneAndUpdate(
      { _id: id, reviewStatus: 'pending' },
      {
        reviewStatus: 'rejected',
        reviewNotes: notes || ""
      }
    );

    res.redirect('/linguist/review');
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).send("Rejection failed");
  }
});

// 👀 Preview course
router.get('/linguist/preview/course/:id', isAdminOrLinguist, async (req, res) => {
  const course = await Course.findById(req.params.id).lean();
  if (!course) return res.status(404).send("Course not found");

  const lessons = await Lesson.find({
    courseId: course._id,
    isArchived: { $ne: true }
  }).lean();

  res.render('linguist/previewCourse', {
    pageTitle: `Preview Course – ${course.title}`,
    course,
    lessons
  });
});

// 👀 Preview lesson
router.get('/linguist/preview/lesson/:id', isAdminOrLinguist, async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).lean();
  if (!lesson) return res.status(404).send("Lesson not found");

  res.render('linguist/previewLesson', {
    pageTitle: `Preview Lesson – ${lesson.title}`,
    lesson
  });
});

// 👀 Preview quiz
router.get('/linguist/preview/quiz/:id', isAdminOrLinguist, async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).lean();
  if (!quiz) return res.status(404).send("Quiz not found");

  res.render('linguist/previewQuiz', {
    pageTitle: `Preview Quiz – ${quiz.title}`,
    quiz
  });
});


module.exports = router;
