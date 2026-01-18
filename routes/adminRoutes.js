const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');  // ✅ admin protection middleware
const User = require('../models/User');             // ✅ user model
const Course = require('../models/Course');         // ✅ course model (create this later)
const Lesson = require('../models/Lesson');
const Feedback = require('../models/Feedback');
const Quiz = require("../models/Quiz");   
const multer = require("multer");
const path = require("path");
const fs = require("fs");


// ============================
// Admin Routes
// ============================

router.get('/admin/dashboard', isAdmin, async (req, res) => {
  try {
    // Optional stats
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();

    res.render('admin/dashboard', { 
      pageTitle: 'Admin Dashboard',
      user: req.session.user,
      totalUsers,
      totalCourses
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Server error');
  }
});

// ============================
// User Management Routes
// ============================

router.get('/admin/users', isAdmin, async (req, res) => {
  try {
    const { role, status, archived } = req.query; // ← FIXED (added archived)
    const filter = {};

    if (role) filter.role = role;
    if (status) filter.status = status;

    // ARCHIVED FILTER (must compare as string)
    if (archived === "true") filter.archived = true;
    else if (archived === "false") filter.archived = false;

    const users = await User.find(filter).lean();

    res.render('admin/users', { 
      pageTitle: 'Manage Users',
      user: req.session.user,
      users,
      selectedRole: role || "",
      selectedStatus: status || "",
      selectedArchived: archived || ""   // ← include for EJS dropdown
    });
  } catch (err) {
    console.error('Error loading users:', err);
    res.status(500).send('Server error');
  }
});



// ✏️ Edit User Page
router.get('/admin/users/edit/:id', isAdmin, async (req, res) => {
  try {
    const userToEdit = await User.findById(req.params.id).lean();

    if (!userToEdit) {
      return res.status(404).send('User not found');
    }

    res.render('admin/editUser', {
      pageTitle: 'Edit User',
      user: req.session.user, // currently logged in admin
      userToEdit
    });
  } catch (err) {
    console.error('Error fetching user for edit:', err);
    res.status(500).send('Server error');
  }
});

// 📝 Update User Info
router.post('/admin/users/edit/:id', isAdmin, async (req, res) => {
  try {
    const { givenName, surname, gender, dateOfBirth, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // 🚫 Prevent changing role if user is admin
    if (user.role === 'admin' && role !== 'admin') {
      return res.status(403).send('You cannot downgrade an admin account');
    }

    // ✅ Proceed safely with update
    await User.findByIdAndUpdate(req.params.id, {
      givenName,
      surname,
      gender,
      dateOfBirth,
      role
    });

    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).send('Update failed');
  }
});


// 🟡 Suspend / Reactivate user (Toggle status)
router.post('/admin/users/toggle-status/:id', isAdmin, async (req, res) => {
  try {
    const { reasonSuspended } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');
    if (user.role === 'admin') return res.status(403).send('You cannot suspend an admin');

    if (user.status === 'active') {
      user.status = 'suspended';
      user.reasonSuspended = reasonSuspended || "No reason provided";
    } else {
      user.status = 'active';
      user.reasonSuspended = ""; // Clear reason when reactivated
    }

    await user.save();
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error toggling status:', err);
    res.status(500).send('Server error');
  }
});



// 🗂️ Archive user
router.post('/admin/users/archive/:id', isAdmin, async (req, res) => {
  try {
    const { reasonArchived } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send('User not found');
    if (user.role === 'admin') return res.status(403).send('You cannot archive an admin account');

    user.archived = true;
    user.reasonArchived = reasonArchived;
    await user.save();

    res.redirect('/admin/users');
  } catch (err) {
    console.error('Error archiving user:', err);
    res.status(500).send('Server error');
  }
});



// ♻️ Unarchive user
router.post('/admin/users/unarchive/:id', isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).send('User not found');
    if (user.role === 'admin') return res.status(403).send('You cannot unarchive an admin account');

    user.archived = false;
    await user.save();

    res.redirect('/admin/users');
  } catch (err) {
    console.error('Unarchive error:', err);
    res.status(500).send('Server error');
  }
});



// ============================
// Course Management Routes
// ============================

router.get('/admin/courses', isAdmin, async (req, res) => {
  try {
    // Include old documents without 'archived' field
    const courses = await Course.find({
      $or: [{ archived: false }, { archived: { $exists: false } }]
    })
      .sort({ createdAt: -1 })
      .lean();

    res.render('admin/courses', { 
      pageTitle: 'Manage Courses',
      user: req.session.user,
      courses
    });
  } catch (err) {
    console.error('Error loading courses:', err);
    res.status(500).send('Server error');
  }
});


// 📘 Manage Courses
router.get('/admin/courses', isAdmin, async (req, res) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 }).lean();
    res.render('admin/courses', {
      pageTitle: 'Manage Courses',
      user: req.session.user,
      courses
    });
  } catch (err) {
    console.error('Error loading courses:', err);
    res.status(500).send('Server error');
  }
});

// ➕ Add new course
router.post('/admin/courses/add', isAdmin, async (req, res) => {
  try {
    const { title, description, level } = req.body;
    await Course.create({ title, description, level });
    res.redirect('/admin/courses');
  } catch (err) {
    console.error('Error adding course:', err);
    res.status(500).send('Server error');
  }
});

// 🗄 Toggle archive (archive/unarchive)
router.post('/admin/courses/toggle-archive/:id', isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).send('Course not found');

    course.archived = !course.archived;
    await course.save();

    res.redirect('/admin/courses');
  } catch (err) {
    console.error('Error toggling archive status:', err);
    res.status(500).send('Server error');
  }
});

// 🗃 View archived courses
router.get('/admin/courses/archived', isAdmin, async (req, res) => {
  try {
    const courses = await Course.find({ archived: true }).sort({ createdAt: -1 });
    res.render('admin/courses', { pageTitle: 'Archived Courses', courses });
  } catch (err) {
    console.error('Error loading archived courses:', err);
    res.status(500).send('Server error');
  }
});



// 📘 View a specific course and its lessons
router.get('/admin/courses/:id', isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) return res.status(404).send('Course not found');

    // ✅ Fetch all lessons linked to this course
    const lessons = await Lesson.find({ courseId: course._id, isArchived: false}).sort({ createdAt: -1 }).lean();
    const archivedLessons = await Lesson.find({ courseId: course._id, isArchived: true }).lean();

    res.render('admin/courseDetails', {
      pageTitle: `Edit ${course.title}`,
      user: req.session.user,
      course,
      lessons, // send lessons to the EJS
      archivedLessons,
    });
  } catch (err) {
    console.error('Error loading course:', err);
    res.status(500).send('Server error');
  }
});


// ✏️ Update Course Info
router.post('/admin/courses/update/:id', isAdmin, async (req, res) => {
  try {
    const { title, description, level } = req.body;
    await Course.findByIdAndUpdate(req.params.id, { title, description, level });
    res.redirect(`/admin/courses/${req.params.id}`);
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).send('Server error');
  }
});

// 🟡 Edit Lesson Page (GET)
router.get('/admin/lessons/edit/:id', isAdmin, async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) return res.status(404).send('Lesson not found');

    const course = await Course.findById(lesson.courseId).lean();

    res.render('admin/editLesson', {
      pageTitle: `Edit Lesson: ${lesson.title}`,
      user: req.session.user,
      lesson,
      course
    });
  } catch (err) {
    console.error('Error loading lesson edit page:', err);
    res.status(500).send('Server error');
  }
});

// 🟢 Save Updated Lesson (POST)
router.post('/admin/lessons/edit/:id', isAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, { title, description });
    res.redirect(`/admin/courses/${lesson.courseId}`);
  } catch (err) {
    console.error('Error updating lesson:', err);
    res.status(500).send('Server error');
  }
});





// ============================
// Admin Settings Route
// ============================

router.get('/admin/settings', isAdmin, (req, res) => {
  res.render('admin/settings', { 
    pageTitle: 'Admin Settings',
    user: req.session.user
  });
});


// 🟢 Add a new lesson to a course
router.post('/admin/lessons/add', isAdmin, async (req, res) => {
  try {
    const { courseId, title, description } = req.body;
    if (!courseId) return res.status(400).send('Missing course ID');

    await Lesson.create({ courseId, title, description });
    res.redirect(`/admin/courses/${courseId}`);
  } catch (err) {
    console.error('Error adding lesson:', err);
    res.status(500).send('Server error');
  }
});

// 🔴 Delete a lesson
// 🧩 Soft Delete (Archive) a Lesson
router.post('/admin/lessons/archive/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { isArchived: true },
      { new: true }
    );

    if (!lesson) return res.status(404).send("Lesson not found");

    // Redirect back to the course details page
    res.redirect(`/admin/courses/${lesson.courseId}`);
  } catch (err) {
    console.error("Error archiving lesson:", err);
    res.status(500).send("Error archiving lesson");
  }
});

// ♻️ Restore Archived Lesson
router.post('/admin/lessons/restore/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { isArchived: false },
      { new: true }
    );

    if (!lesson) return res.status(404).send("Lesson not found");

    res.redirect(`/admin/courses/${lesson.courseId}`);
  } catch (err) {
    console.error("Error restoring lesson:", err);
    res.status(500).send("Error restoring lesson");
  }
});

// ✅ Auto-create syllabus folder if missing
const syllabusDir = path.join(__dirname, "../public/uploads/syllabus");
if (!fs.existsSync(syllabusDir)) {
  fs.mkdirSync(syllabusDir, { recursive: true });
}

// ✅ Multer config (10 MB limit, PDF only)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, syllabusDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"));
  },
});

// ✅ Upload or Replace Syllabus
router.post("/admin/courses/:id/upload-syllabus", upload.single("syllabus"), async (req, res) => {
  try {
    const syllabusPath = "/uploads/syllabus/" + req.file.filename;

    // Optional: delete old syllabus file if exists
    const course = await Course.findById(req.params.id);
    if (course.syllabusPath) {
      const oldPath = path.join(__dirname, "../public", course.syllabusPath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Save new file path
    await Course.findByIdAndUpdate(req.params.id, { syllabusPath });
    res.redirect(`/admin/courses/${req.params.id}`);
  } catch (err) {
    console.error("Error uploading syllabus:", err);
    res.status(500).send("Error uploading syllabus");
  }
});

// ============================
// SAVE / UPDATE QUIZ SETTINGS
// ============================
router.post('/admin/lessons/:lessonId/quiz/settings', async (req, res) => {
  try {
    const { timeLimit, passingGrade, description } = req.body;
    const lessonId = req.params.lessonId;

    // Find the quiz
    const quiz = await Quiz.findOne({ lessonId, isFinalExam: false });
    if (!quiz) return res.status(404).send("Quiz not found");

    // ✅ Convert & update safely
    if (timeLimit) quiz.timeLimit = Number(timeLimit) * 60; // minutes → seconds
    if (description) quiz.description = description;

    // ✅ Only update passingGrade if the form sent it
    if (passingGrade !== undefined && passingGrade !== "") {
      const parsedGrade = Number(passingGrade);
      if (!isNaN(parsedGrade)) {
        quiz.passingGrade = parsedGrade;
      } else {
        console.warn("⚠️ Invalid passingGrade value:", passingGrade);
      }
    }
    // else: leave existing or default intact

    quiz.gradingMethod = "highest";

    await quiz.save();
    console.log("✅ Quiz settings updated:", quiz.title);

    res.redirect(`/admin/lessons/${lessonId}/quiz?success=1`);
  } catch (err) {
    console.error("❌ Error saving quiz settings:", err);
    res.status(500).send("Server error while saving quiz settings");
  }
});



// ===============================
// QUIZ MANAGEMENT ROUTES
// ===============================

// 🔹 Helper for smarter text normalization
function norm(s) {
  return (s || "")
    .trim()
    .replace(/\s+/g, " ")         // collapse spaces
    .replace(/[^\p{L}\p{N} ]/gu, "") // remove punctuation/symbols
    .toLowerCase();
}

// ===============================
// GET: Create / Manage Quiz Page
// ===============================
router.get('/admin/lessons/:id/quiz', async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    const quiz = await Quiz.findOne({ lessonId: lesson._id });

    res.render('admin/manageQuiz', {
      lesson,
      quiz,
      pageTitle: quiz ? "Manage Quiz" : "Create Quiz"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading quiz page");
  }
});

// ===============================
// POST: Create New Quiz
// ===============================
router.post('/admin/lessons/:id/quiz', async (req, res) => {
  try {
    const { title } = req.body;
    const newQuiz = new Quiz({
      lessonId: req.params.id,
      title,
      timeLimit: 1200 // seconds
    });

    await newQuiz.save();
    await Lesson.findByIdAndUpdate(req.params.id, { hasQuiz: true });

    res.redirect(`/admin/lessons/${req.params.id}/quiz`);
  } catch (err) {
    console.error("Error saving quiz:", err);
    res.status(500).send("Error saving quiz");
  }
});

// ===============================
// POST: Add Question
// ===============================
router.post('/admin/quiz/:id/add', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).send("Quiz not found");

    const questionText = req.body.questionText || "";
    const options = (req.body.options || "")
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const correctRaw = req.body.correctAnswer || "";
    const nc = norm(correctRaw);

    // Smart matching: exact → contains → reverse contains
    let matchIndex = options.findIndex(o => norm(o) === nc);
    if (matchIndex === -1) matchIndex = options.findIndex(o => norm(o).includes(nc));
    if (matchIndex === -1) matchIndex = options.findIndex(o => nc.includes(norm(o)));

    if (matchIndex === -1) {
      options.push(correctRaw.trim());
      matchIndex = options.length - 1;
    }

    const canonicalCorrect = options[matchIndex];

    quiz.questions.push({
      questionText,
      options,
      correctAnswer: canonicalCorrect
    });

    await quiz.save();
    res.redirect(`/admin/lessons/${quiz.lessonId}/quiz`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding question");
  }
});

// ===============================
// ✅ GET: Edit Question Page
// ===============================
router.get('/admin/quiz/:quizId/edit/:index', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).send("Quiz not found");

    const question = quiz.questions[req.params.index];
    if (!question) return res.status(404).send("Question not found");

    res.render('admin/editQuestion', {
      quiz,
      question,
      index: req.params.index,
      pageTitle: "Edit Question"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading question for editing");
  }
});

// ===============================
// ✅ POST: Update Question
// ===============================
router.post('/admin/quiz/:quizId/edit/:index', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).send("Quiz not found");

    const idx = Number(req.params.index);
    if (!quiz.questions[idx]) return res.status(404).send("Question not found");

    const questionText = req.body.questionText || "";
    const options = (req.body.options || "")
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const correctRaw = req.body.correctAnswer || "";
    const nc = norm(correctRaw);

    let matchIndex = options.findIndex(o => norm(o) === nc);
    if (matchIndex === -1) matchIndex = options.findIndex(o => norm(o).includes(nc));
    if (matchIndex === -1) matchIndex = options.findIndex(o => nc.includes(norm(o)));

    if (matchIndex === -1) {
      options.push(correctRaw.trim());
      matchIndex = options.length - 1;
    }

    const canonicalCorrect = options[matchIndex];

    quiz.questions[idx] = {
      questionText,
      options,
      correctAnswer: canonicalCorrect
    };

    await quiz.save();
    res.redirect(`/admin/lessons/${quiz.lessonId}/quiz`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating question");
  }
});

// ===============================
// POST: Delete Question
// ===============================
router.post('/admin/quiz/:quizId/delete/:index', async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).send("Quiz not found");

    quiz.questions.splice(req.params.index, 1);
    await quiz.save();

    res.redirect(`/admin/lessons/${quiz.lessonId}/quiz`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting question");
  }
});

module.exports = router;

//==================================
// 🧩 Save / Update Exam Settings
//==================================
router.post("/admin/courses/:id/final-exam/settings", async (req, res) => {
  const { id } = req.params;
  const { timeLimit, waitDays, passingGrade, gradingMethod, description } = req.body;

  try {
    // ✅ Update the course
    const course = await Course.findByIdAndUpdate(
      id,
      {
        $set: {
          "examSettings.timeLimit": timeLimit,
          "examSettings.waitDays": waitDays,
          "examSettings.passingGrade": passingGrade,
          "examSettings.gradingMethod": gradingMethod,
          "examSettings.description": description,
        },
      },
      { new: true }
    );

    // ✅ Update or create the corresponding final exam quiz
    let quiz = await Quiz.findOne({ courseId: id, isFinalExam: true });

if (quiz) {
  quiz.timeLimit = course.examSettings.timeLimit * 60; // keep synced
  await quiz.save();
}


    console.log("🧠 quiz.timeLimit:", quiz.timeLimit, "course.examSettings.timeLimit:", course.examSettings.timeLimit);

    console.log(`✅ Synced time limit: ${timeLimit} mins (${timeLimit * 60}s)`);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Error updating exam settings:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});





// 📘 GET /admin/courses/:id/final-exam → show Final Exam builder
router.get('/admin/courses/:id/final-exam', isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) return res.status(404).send('Course not found');

    // Try to find existing final exam
    const quiz = await Quiz.findOne({ courseId: course._id, isFinalExam: true }).lean();

    res.render('admin/finalExamBuilder', {
      pageTitle: `Final Exam - ${course.title}`,
      course,
      quiz
    });
  } catch (err) {
    console.error('Error loading final exam:', err);
    res.status(500).send('Server error');
  }
});

// 🧩 POST /admin/courses/:id/final-exam → save Final Exam
// 🧠 POST /admin/courses/:id/final-exam → Add new question to Final Exam
router.post('/admin/courses/:id/final-exam', isAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    const { questionText, options, correctAnswer } = req.body;

    // ✅ Parse options safely (convert textarea → array)
    const parsedOptions = (options || "")
      .split('\n')
      .map(o => o.trim())
      .filter(Boolean);

    // ✅ Validate fields
    if (!questionText || parsedOptions.length === 0 || !correctAnswer) {
      console.warn("Missing required fields:", { questionText, parsedOptions, correctAnswer });
      return res.status(400).send("Missing required fields");
    }

    // ✅ Fetch the course first so it's available everywhere
    const course = await Course.findById(courseId).lean();
    if (!course) return res.status(404).send("Course not found");

    // ✅ Try to find existing final exam for this course
    let quiz = await Quiz.findOne({ courseId, isFinalExam: true });

    if (!quiz) {
      // 🧩 Create a new Final Exam document if it doesn't exist yet
      quiz = new Quiz({
        courseId,
        isFinalExam: true,
        title: `Final Exam - ${course.title || courseId}`,
        questions: [],
        timeLimit: (course.examSettings?.timeLimit || 120) * 60
      });
    } else {
      // ✅ Update time limit from course if needed
      quiz.timeLimit = (course.examSettings?.timeLimit || 120) * 60;
    }

    // ✅ Normalize answers for safe comparison
    const norm = s => (s || "").trim().replace(/\s+/g, " ").toLowerCase();
    const correctNorm = norm(correctAnswer);
    const matchedOption = parsedOptions.find(opt => norm(opt) === correctNorm) || correctAnswer;

    // ✅ Add the new question
    quiz.questions.push({
      questionText,
      options: parsedOptions,
      correctAnswer: matchedOption
    });

    await quiz.save();
    console.log("✅ Final exam question added:", questionText);

    res.redirect(`/admin/courses/${courseId}/final-exam`);
  } catch (err) {
    console.error("❌ Error saving final exam question:", err);
    res.status(500).send("Server error while saving final exam question");
  }
});



// 🧩 POST: Edit Final Exam Question
router.post('/admin/courses/:id/final-exam/edit/:index', isAdmin, async (req, res) => {
  try {
    const { questionText, options, correctAnswer } = req.body;
    const courseId = req.params.id;
    const index = Number(req.params.index);

    const parsedOptions = (options || "").split('\n').map(o => o.trim()).filter(Boolean);

    const quiz = await Quiz.findOne({ courseId, isFinalExam: true });
    if (!quiz) return res.status(404).send("Final exam not found");

    if (!quiz.questions[index]) return res.status(404).send("Question not found");

    quiz.questions[index] = {
      questionText,
      options: parsedOptions,
      correctAnswer
    };

    await quiz.save();
    res.redirect(`/admin/courses/${courseId}/final-exam`);
  } catch (err) {
    console.error("Error editing final exam question:", err);
    res.status(500).send("Error editing question");
  }
});

// 🗑️ POST: Delete Final Exam Question
router.post('/admin/courses/:id/final-exam/delete/:index', isAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    const index = Number(req.params.index);

    const quiz = await Quiz.findOne({ courseId, isFinalExam: true });
    if (!quiz) return res.status(404).send("Final exam not found");

    quiz.questions.splice(index, 1);
    await quiz.save();

    res.redirect(`/admin/courses/${courseId}/final-exam`);
  } catch (err) {
    console.error("Error deleting final exam question:", err);
    res.status(500).send("Error deleting question");
  }
});


// 📘 Admin View Course Page (separate from user-facing /courses/:id/view)
router.get('/admin/courses/:id/view', isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) return res.status(404).send('Course not found');

    // Get active & archived lessons
    const lessons = await Lesson.find({ courseId: course._id, isArchived: false })
      .sort({ createdAt: 1 })
      .lean();
    const archivedLessons = await Lesson.find({ courseId: course._id, isArchived: true }).lean();

    // Get final exam (if exists)
    const finalExam = await Quiz.findOne({ courseId: course._id, isFinalExam: true }).lean();

    res.render('admin/courseDetails', {
      pageTitle: `View Course - ${course.title}`,
      user: req.session.user,
      course,
      lessons,
      archivedLessons,
      finalExam
    });
  } catch (err) {
    console.error('Error loading admin course view:', err);
    res.status(500).send('Server error');
  }
});

// ============================
// Certificate Management
// ============================

const certDir = path.join(__dirname, "../public/uploads/certificates");
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const certStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, certDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});

const uploadCertificate = multer({
  storage: certStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed!"));
  },
});

// ✅ Upload or Replace Certificate
router.post("/admin/courses/:id/upload-certificate",
  uploadCertificate.single("certificateFile"), 
  async (req, res) => {

    const course = await Course.findById(req.params.id);

    // delete old cert (optional)
    if (course.certificateFile) {
      const oldPath = path.join(__dirname, "../public/uploads/certificates", course.certificateFile);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    course.certificateFile = req.file.filename;
    await course.save();

    res.redirect(`/admin/courses/${req.params.id}`);
});

// ============================
// Lesson Image Upload (5 MB, images only)
// ============================

const lessonImageDir = path.join(__dirname, "../public/uploads/lessons");
if (!fs.existsSync(lessonImageDir)) {
  fs.mkdirSync(lessonImageDir, { recursive: true });
}

const lessonImageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, lessonImageDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});

const uploadLessonImage = multer({
  storage: lessonImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // ✅ 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed!"));
  },
});

router.post("/admin/lessons/upload-image", uploadLessonImage.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  // Return path to use inside HugeRTE
  const imageUrl = `/uploads/lessons/${req.file.filename}`;
  res.json({ location: imageUrl });
});



// ============================
// feeddback Management Route
// ============================

router.get("/admin/feedback", async (req, res) => {
  try {
    const filter = req.query.filter || "all";
    const query = {};

    if (filter === "pending") query.status = "pending";
    if (filter === "reviewed") query.status = "reviewed";
    if (filter === "archived") query.archived = true;
    if (filter === "active") query.archived = false;

    const feedbacks = await Feedback.find(query)
      .populate("userId", "username")
      .sort({ createdAt: -1 });

    res.render("admin/feedback", { feedbacks, filter });
  } catch (err) {
    console.error("Error loading feedback:", err);
    res.status(500).send("Error loading feedback");
  }
});
// Mark a feedback as reviewed
router.post("/admin/feedback/:id/mark-reviewed", async (req, res) => {
  try {
    await Feedback.findByIdAndUpdate(req.params.id, { status: "reviewed" });
    res.redirect("/admin/feedback");
  } catch (err) {
    console.error("Error updating feedback status:", err);
    res.status(500).send("Error updating feedback");
  }
});

// ✅ Archive feedback
router.post("/admin/feedback/:id/archive", async (req, res) => {
  try {
    await Feedback.findByIdAndUpdate(req.params.id, { archived: true });
    res.redirect("/admin/feedback");
  } catch (err) {
    console.error("Error archiving feedback:", err);
    res.status(500).send("Error archiving feedback");
  }
});

router.post("/admin/feedback/:id/restore", async (req, res) => {
  try {
    await Feedback.findByIdAndUpdate(req.params.id, { archived: false });
    res.redirect("/admin/feedback");
  } catch (err) {
    console.error("Error restoring feedback:", err);
    res.status(500).send("Error restoring feedback");
  }
});

// ============================
// Logout Route
// ============================

router.get('/logout', (req, res) => {
  // If using express-session
  req.session.destroy((err) => {
    if (err) {
      console.log('Error destroying session:', err);
      return res.redirect('/admin/dashboard');
    }
    res.clearCookie('connect.sid'); // optional: clears the session cookie
    res.redirect('/login');
  });
});

module.exports = router;
