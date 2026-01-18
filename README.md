# Chabalingo – Capstone Project

Chabalingo is a web-based language learning platform developed as a team capstone project.  
The system is designed to support the learning and preservation of the Chavacano language through structured lessons and assessments.

## Tech Stack
- Node.js
- MongoDB
- HTML, CSS, JavaScript

## Features and Modules

The system has two types of users: **User** and **Admin**, each with access to different features based on their role.

### User Modules
- **User Authentication Module**  
  Allows users to register, log in, and recover forgotten passwords using email OTP verification.

- **User Dashboard Module**  
  Displays user progress including enrolled courses, completed certificates, current date, and pending lessons.

- **Course Management Module**  
  Enables users to view available courses, enroll, access lessons, and take quizzes or final exams.

- **Certificate Module**  
  Automatically generates certificates after successfully passing a final examination and displays them in the user account.

- **Feedback Module**  
  Allows users to submit feedback which can be reviewed by the administrator.

- **Settings Module**  
  Enables users to manage their account details such as editing profile information and changing passwords.

### Admin Modules
- **Admin Dashboard Module**  
  Provides an overview of the total number of users and courses in the system.

- **User Management Module**  
  Allows administrators to view, edit, and archive user accounts and manage user roles.

- **Course Administration Module**  
  Enables management of courses and content including syllabus, lessons, quizzes, final exams, and certificates.

- **Feedback Management Module**  
  Allows administrators to review, manage, and archive submitted feedback.

## My Role

This was a team-based capstone project.  
I served as the **team leader** and was primarily responsible for backend development.

My contributions include:
- Leading the development team and coordinating project tasks and timelines
- Developing the backend using Node.js and integrating MongoDB for data storage
- Implementing user and admin modules with full CRUD functionality
- Assisting in front-end development and UI integration when needed


## How to Run
```bash
npm install
npm run dev
