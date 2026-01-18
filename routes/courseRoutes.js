// routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

router.get("/:id/view", async (req, res) => {
  try {
    const courseId = req.params.id;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).send("Course not found");

    const lessons = await Lesson.find({ courseId, isArchived: false  });

    res.render("admin/viewCourse", {
      pageTitle: course.title || "View Course",
      course,
      lessons
    });

  } catch (err) {
    console.error("Error loading course:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
