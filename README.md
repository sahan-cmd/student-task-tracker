# Student Task Tracker

A browser-based productivity application for organizing student assignments, coursework, deadlines, notes, and reminders.

## Requirements

### Functional Requirements

- Create tasks with a title, course, due date, due time, optional note, and reminder.
- Display saved tasks with countdown and overdue status.
- Complete, delete, and update task reminders.
- Search tasks by title, course, or note.
- Add and manage course names.
- Receive in-app and optional browser reminders.
- Clear expired, completed, or all tasks.
- Export and import application data.
- Import calendar data from `.ics` files or a public calendar URL.
- Switch between light and dark themes.
- Keep task and course data after refreshing the browser.

### Non-Functional Requirements

- The interface should be simple and easy to use.
- The application should work on desktop, tablet, and mobile screens.
- User data should be stored locally in the browser.
- Required form fields should be validated before saving.
- The interface should provide accessible labels and status messages.
- No backend server or user registration should be required.

## Software Features

### Task Management

Students can create assignments with deadlines, due times, notes, and reminders. Tasks can be completed, deleted, and updated.

### Task Search and Organization

The search bar filters tasks while typing. It searches the task title, course name, and note. Each task shows its countdown or overdue status.

### Course Management

Users can add reusable course names and select a course when creating a task.

### Reminder System

The application supports preset and custom reminder intervals. It displays in-app reminders and can use browser notifications when supported.

### Backup and Restore

Users can download task data as a JSON backup and restore it later. Calendar tasks can also be imported from iCalendar files or public `.ics` URLs.

### Theme and Responsive Design

The application supports light and dark themes and adapts its layout for smaller screens.

## User Roles

### Student User

The student is the primary and only user role. The student can:

- Create, view, search, complete, edit, and delete tasks.
- Add and manage courses.
- Configure reminders and notification settings.
- Import and export personal task data.
- Change the application theme.
- Clear or reset locally stored data.

### Administrator

There is no separate administrator role. This is a personal, single-user application with no accounts or server-side permissions.

## Technologies Used

- **HTML5** - Page structure, forms, task list, controls, and accessibility labels.
- **CSS3** - Responsive layout, themes, colors, spacing, task states, and animations.
- **JavaScript (ES6+)** - Task management, search, countdowns, reminders, import/export, and user interactions.
- **Web Storage API (`localStorage`)** - Stores tasks, courses, preferences, and backup history locally.
- **Browser Notifications API** - Provides optional system notifications when supported and permitted.
- **File API** - Processes imported JSON and iCalendar files in the browser.
- **Blob and URL APIs** - Create downloadable backup files without a backend server.

## Project Files

- `Index.html` - Main application structure.
- `style.css` - Application styling and responsive design.
- `app.js` - Application logic and interactive features.
- `Student_Task_Tracker_Documentation.docx` - Word-format project documentation.

## Limitations

- Data is stored only in the current browser and device.
- There is no cloud synchronization or multi-user collaboration.
- Browser notification support depends on browser permissions and security settings.
- Calendar URL imports may be restricted by cross-origin browser security.

## How to Run

1. Open `Index.html` in a modern web browser.
2. Add courses and create tasks using the task form.
3. Use the task list to search, complete, clear, or delete tasks.
4. Use the **Backup and restore** section to export or import data.

No database, package installation, or backend server is required for the basic application.
