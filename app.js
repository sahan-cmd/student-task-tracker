const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
const subjectInput = document.getElementById('subject');
const courseList = document.getElementById('course-list');
const courseNameInput = document.getElementById('course-name');
const notificationStatus = document.getElementById('notification-status');
const statusIcon = notificationStatus.querySelector('.status-icon');
const statusText = notificationStatus.querySelector('.status-text');
const notificationToggle = document.getElementById('notification-toggle');
const themeToggle = document.getElementById('theme-toggle');
const courseManager = document.getElementById('course-manager');
const toggleCourseManagerButton = document.getElementById('toggle-course-manager');
const clearTaskFilter = document.getElementById('clear-task-filter');
const clearSelectedTasksButton = document.getElementById('clear-selected-tasks');
const taskSearchInput = document.getElementById('task-search-input');
const reminderSelect = document.getElementById('reminder');
const customReminder = document.getElementById('custom-reminder');
const customReminderMinutes = document.getElementById('custom-reminder-minutes');
const customReminderOption = reminderSelect.querySelector('option[value="custom"]');
const reminderToast = document.getElementById('reminder-toast');
const reminderToastTitle = document.getElementById('reminder-toast-title');
const reminderToastMessage = document.getElementById('reminder-toast-message');
const closeReminderToast = document.getElementById('close-reminder-toast');
const exportDataButton = document.getElementById('export-data');
const importDataButton = document.getElementById('import-data');
const downloadCalendarUrlButton = document.getElementById('download-calendar-url');
const calendarUrlInput = document.getElementById('calendar-url');
const resetAppDataButton = document.getElementById('reset-app-data');
const saveAllBackupsButton = document.getElementById('save-all-backups');
const importFileInput = document.getElementById('import-file');
const backupHistoryList = document.getElementById('backup-history-list');
const toggleBackupsButton = document.getElementById('toggle-backups');
const backupHistoryKey = 'importedBackups';
const activeBackupKey = 'activeBackupId';
const lastBackupKey = 'lastBackupId';
const activeBackupLabel = document.getElementById('active-backup-label');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let courses = JSON.parse(localStorage.getItem('courses')) || [];
const storedNotificationsEnabled = localStorage.getItem('notificationsEnabled');
let notificationsEnabled = storedNotificationsEnabled === null || storedNotificationsEnabled === 'true';
if (storedNotificationsEnabled === null) localStorage.setItem('notificationsEnabled', 'true');
let theme = localStorage.getItem('theme') || 'dark';
let activeBackupId = localStorage.getItem(activeBackupKey);
let useAllBackups = false;
const expandedTaskNotes = new Set();
const browserNotificationsAvailable = location.protocol !== 'file:' && 'Notification' in window && window.isSecureContext;
let reminderToastTimer;

function showReminderToast(task) {
  reminderToastTitle.textContent = `Task reminder: ${task.title}`;
  reminderToastMessage.textContent = `${task.subject} is due at ${task.dueTime || '23:59'}.`;
  reminderToast.hidden = false;
  reminderToast.classList.remove('show');
  requestAnimationFrame(() => reminderToast.classList.add('show'));
  clearTimeout(reminderToastTimer);
  reminderToastTimer = setTimeout(() => {
    reminderToast.classList.remove('show');
    setTimeout(() => { reminderToast.hidden = true; }, 200);
  }, 7000);
}

closeReminderToast.addEventListener('click', () => {
  clearTimeout(reminderToastTimer);
  reminderToast.classList.remove('show');
  setTimeout(() => { reminderToast.hidden = true; }, 200);
});

function updateTheme() {
  document.documentElement.dataset.theme = theme;
  const darkMode = theme === 'dark';
  themeToggle.textContent = darkMode ? '☀' : '☾';
  themeToggle.setAttribute('aria-label', darkMode ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.title = darkMode ? 'Switch to light mode' : 'Switch to dark mode';
}

themeToggle.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
  updateTheme();
});

if (!courses.length) {
  courses = [...new Set(tasks.map((task) => task.subject).filter(Boolean))];
}

updateTheme();

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveCourses() {
  localStorage.setItem('courses', JSON.stringify(courses));
}

function getStoredAppData() {
  const storage = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && key !== backupHistoryKey && key !== activeBackupKey && key !== lastBackupKey) storage[key] = localStorage.getItem(key);
  }
  return storage;
}

function getBackupData() {
  return {
    app: 'student-task-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { storage: getStoredAppData() }
  };
}

function isValidBackup(backup) {
  return backup?.app === 'student-task-tracker'
    && backup?.version === 1
    && backup.data
    && (backup.data.storage && typeof backup.data.storage === 'object' || Array.isArray(backup.data.tasks));
}

function getBackupStorage(backup) {
  if (backup.data.storage) return backup.data.storage;
  return {
    tasks: JSON.stringify(backup.data.tasks),
    courses: JSON.stringify(backup.data.courses),
    notificationsEnabled: String(backup.data.notificationsEnabled),
    theme: backup.data.theme
  };
}

function getBackupHistory() {
  try {
    return JSON.parse(localStorage.getItem(backupHistoryKey)) || [];
  } catch {
    return [];
  }
}

function saveBackupHistory(history) {
  localStorage.setItem(backupHistoryKey, JSON.stringify(history));
}

function setActiveBackup(id) {
  activeBackupId = id;
  if (id) {
    localStorage.setItem(activeBackupKey, id);
    localStorage.setItem(lastBackupKey, id);
  }
  else localStorage.removeItem(activeBackupKey);
}

function renderBackupHistory() {
  const history = getBackupHistory();
  const activeBackup = history.find((backup) => backup.id === activeBackupId);
  activeBackupLabel.textContent = useAllBackups
    ? 'Currently using: All imported backups'
    : `Currently using: ${activeBackup ? getBackupDisplayName(activeBackup.name) : 'App data'}`;
  backupHistoryList.innerHTML = history.length ? history.map((backup) => `
    <li class="backup-item" data-backup-id="${backup.id}" tabindex="0" role="button" aria-label="View ${escapeHtml(getBackupDisplayName(backup.name))}">
      <div class="task-info">
        <strong><svg class="backup-file-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 1.5V8h3.5L13 4.5ZM8 12h8v1.5H8V12Zm0 3h8v1.5H8V15Z" /></svg>${escapeHtml(getBackupDisplayName(backup.name))}${backup.id === activeBackupId && !useAllBackups ? ' <small class="active-backup-badge">ACTIVE</small>' : ''}</strong>
        <span>Imported: ${new Date(backup.importedAt).toLocaleString()}</span>
        <small class="backup-description">Tasks: ${getBackupTaskCount(backup.backup)}</small>
      </div>
      <div class="action-btns">
        <button type="button" class="save-backup" data-backup-id="${backup.id}" aria-label="Save ${escapeHtml(backup.name)} data to app">Save to app</button>
        <button type="button" class="delete-backup btn-delete" data-backup-id="${backup.id}">Delete</button>
      </div>
    </li>
  `).join('') : '<li class="empty-backup-history">No imported backups</li>';
  toggleBackupsButton.hidden = history.length < 2;
  toggleBackupsButton.textContent = useAllBackups ? 'Use last backup' : 'Use all backups';
  saveAllBackupsButton.hidden = !useAllBackups;
}

function getBackupDisplayName(fileName) {
  return fileName.replace(/\.json$/i, '');
}

function getBackupTaskCount(backup) {
  try {
    const storage = getBackupStorage(backup);
    const backupTasks = JSON.parse(storage.tasks || '[]');
    return Array.isArray(backupTasks) ? backupTasks.length : 0;
  } catch {
    return 0;
  }
}

function applyBackupStorage(storage, shouldMerge) {
  let importedTasks = [];
  let importedCourses = [];
  try {
    importedTasks = JSON.parse(storage.tasks || '[]');
    importedCourses = JSON.parse(storage.courses || '[]');
  } catch {
    throw new Error('Invalid task data');
  }
  if (!Array.isArray(importedTasks) || !Array.isArray(importedCourses)) throw new Error('Invalid task data');

  const mergedStorage = { ...storage };
  if (shouldMerge) {
    mergedStorage.tasks = JSON.stringify([...tasks, ...importedTasks]);
    mergedStorage.courses = JSON.stringify([...new Set([...courses, ...importedCourses])]);
  } else {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (key && key !== backupHistoryKey) localStorage.removeItem(key);
    }
  }
  Object.entries(mergedStorage).forEach(([key, value]) => {
    if (key !== backupHistoryKey && typeof value === 'string') localStorage.setItem(key, value);
  });
  tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  courses = JSON.parse(localStorage.getItem('courses')) || [];
  notificationsEnabled = localStorage.getItem('notificationsEnabled') === 'true';
  theme = localStorage.getItem('theme') || 'dark';
}

function restoreBackup(backup, preserveTheme = true) {
  const currentTheme = theme;
  applyBackupStorage(getBackupStorage(backup), false);
  if (preserveTheme) {
    theme = currentTheme;
    localStorage.setItem('theme', theme);
  }
  updateTheme();
  renderCourses();
  renderTasks();
  updateNotificationStatus();
  updateCountdowns();
  renderBackupHistory();
}

function getBackupTasksAndCourses(history) {
  const allTasks = [];
  const allCourses = new Set();
  history.forEach((entry) => {
    const storage = getBackupStorage(entry.backup);
    try {
      const entryTasks = JSON.parse(storage.tasks || '[]');
      const entryCourses = JSON.parse(storage.courses || '[]');
      if (Array.isArray(entryTasks)) allTasks.push(...entryTasks);
      if (Array.isArray(entryCourses)) entryCourses.forEach((course) => allCourses.add(course));
    } catch {
      return;
    }
  });
  return { tasks: allTasks, courses: [...allCourses] };
}

function useAllBackupData() {
  const history = getBackupHistory();
  const lastBackup = history.find((backup) => backup.id === activeBackupId) || history[0];
  if (!lastBackup) return;
  const combined = getBackupTasksAndCourses(history);
  const lastStorage = getBackupStorage(lastBackup.backup);
  const currentTheme = theme;
  applyBackupStorage({
    ...lastStorage,
    tasks: JSON.stringify(combined.tasks),
    courses: JSON.stringify(combined.courses)
  }, false);
  theme = currentTheme;
  localStorage.setItem('theme', theme);
  setActiveBackup(lastBackup.id);
  useAllBackups = true;
  updateTheme();
  renderCourses();
  renderTasks();
  updateNotificationStatus();
  updateCountdowns();
  renderBackupHistory();
}

function useLastBackupData() {
  const history = getBackupHistory();
  const lastBackupId = activeBackupId || localStorage.getItem(lastBackupKey);
  const lastBackup = history.find((backup) => backup.id === lastBackupId) || history[0];
  if (!lastBackup) return;
  useAllBackups = false;
  restoreBackup(lastBackup.backup);
  setActiveBackup(lastBackup.id);
  renderBackupHistory();
}

function saveAllBackupsToApp() {
  if (!useAllBackups) return;
  setActiveBackup(null);
  useAllBackups = false;
  saveAllBackupsButton.hidden = true;
  renderBackupHistory();
}

function clearCurrentAppData() {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key && key !== backupHistoryKey) localStorage.removeItem(key);
  }
  tasks = [];
  courses = [];
  notificationsEnabled = true;
  localStorage.setItem('notificationsEnabled', 'true');
  theme = 'dark';
  useAllBackups = false;
  setActiveBackup(null);
  updateTheme();
  renderCourses();
  renderTasks();
  updateNotificationStatus();
  updateCountdowns();
}

function resetAllAppData() {
  localStorage.clear();
  tasks = [];
  courses = [];
  notificationsEnabled = true;
  localStorage.setItem('notificationsEnabled', 'true');
  theme = 'dark';
  useAllBackups = false;
  activeBackupId = null;
  updateTheme();
  renderCourses();
  renderTasks();
  updateNotificationStatus();
  updateCountdowns();
  renderBackupHistory();
  toggleBackupsButton.hidden = true;
  saveAllBackupsButton.hidden = true;
}

exportDataButton.addEventListener('click', () => {
  const file = new Blob([JSON.stringify(getBackupData(), null, 2)], { type: 'application/json' });
  const downloadUrl = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = downloadUrl;
  const defaultName = `student-task-tracker-backup-${new Date().toISOString().slice(0, 10)}`;
  const enteredName = prompt('Enter a name for this backup (optional):', defaultName);
  if (enteredName === null) {
    URL.revokeObjectURL(downloadUrl);
    return;
  }
  const safeName = enteredName.trim().replace(/[\\/:*?"<>|]/g, '-');
  link.download = `${safeName || defaultName}.json`;
  link.click();
  URL.revokeObjectURL(downloadUrl);
});

importDataButton.addEventListener('click', () => importFileInput.click());

toggleBackupsButton.addEventListener('click', () => {
  if (useAllBackups) useLastBackupData();
  else useAllBackupData();
});

saveAllBackupsButton.addEventListener('click', saveAllBackupsToApp);

resetAppDataButton.addEventListener('click', () => {
  if (!confirm('This will permanently delete all tasks, courses, settings, and imported backups. Continue?')) return;
  resetAllAppData();
});

importFileInput.addEventListener('change', async () => {
  const [file] = importFileInput.files;
  importFileInput.value = '';
  if (!file) return;

  try {
    const fileText = await file.text();
    if (/\.ics$/i.test(file.name) || file.type === 'text/calendar') {
      const importedTasks = parseIcsEvents(fileText);
      if (!importedTasks.length) throw new Error('No calendar events found');
      const result = addImportedCalendarTasks(importedTasks);
      alert(`${result.importedCount} calendar event${result.importedCount === 1 ? '' : 's'} imported${result.skippedCount ? ' (duplicates skipped)' : ''}.`);
    } else {
      const backup = JSON.parse(fileText);
      if (!isValidBackup(backup)) throw new Error('Invalid backup format');

      applyBackupStorage(getBackupStorage(backup), false);
      useAllBackups = false;
      const history = getBackupHistory();
      const backupId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      history.unshift({ id: backupId, name: file.name, importedAt: new Date().toISOString(), backup });
      setActiveBackup(backupId);
      saveBackupHistory(history);
      updateTheme();
      renderCourses();
      renderTasks();
      updateNotificationStatus();
      renderBackupHistory();
      alert('Backup imported successfully.');
    }
  } catch {
    alert('This file is not a valid Student Task Tracker backup or iCalendar (.ics) file.');
  }
});

function unfoldIcsLines(icsText) {
  return icsText.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
}

function decodeIcsText(value = '') {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\').trim();
}

function parseIcsDate(value, isDateOnly) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!match) return null;
  const [, year, month, day, hour = '23', minute = '59', second = '0'] = match;
  const date = value.endsWith('Z')
    ? new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)))
    : new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
  if (Number.isNaN(date.getTime())) return null;
  return {
    deadline: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    dueTime: isDateOnly ? '23:59' : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  };
}

function parseIcsEvents(icsText) {
  const lines = unfoldIcsLines(icsText);
  const events = [];
  let currentEvent = null;
  lines.forEach((line) => {
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
      return;
    }
    if (line === 'END:VEVENT') {
      if (currentEvent) events.push(currentEvent);
      currentEvent = null;
      return;
    }
    if (!currentEvent) return;
    const separatorIndex = line.indexOf(':');
    if (separatorIndex < 0) return;
    const property = line.slice(0, separatorIndex);
    const value = decodeIcsText(line.slice(separatorIndex + 1));
    const propertyName = property.split(';')[0].toUpperCase();
    if (!currentEvent[propertyName]) currentEvent[propertyName] = { value, property };
  });
  return events.map((event) => {
    const start = event.DTSTART;
    const parsedDate = start && parseIcsDate(start.value, /(?:^|;)VALUE=DATE(?:;|$)/i.test(start.property) || /^\d{8}$/.test(start.value));
    if (!parsedDate || !event.SUMMARY?.value) return null;
    const subject = event.CATEGORIES?.value.split(',')[0]?.trim() || 'Imported calendar';
    return {
      title: event.SUMMARY.value,
      subject,
      deadline: parsedDate.deadline,
      dueTime: parsedDate.dueTime,
      reminderMinutes: 15,
      note: event.DESCRIPTION?.value || '',
      completed: false,
      notified: false,
      calendarUid: event.UID?.value || ''
    };
  }).filter(Boolean);
}

function addImportedCalendarTasks(importedTasks) {
  const existingUids = new Set(tasks.map((task) => task.calendarUid).filter(Boolean));
  const newTasks = importedTasks.filter((task) => !task.calendarUid || !existingUids.has(task.calendarUid));
  const importedCourses = newTasks.map((task) => task.subject).filter(Boolean);
  tasks.push(...newTasks);
  courses = [...new Set([...courses, ...importedCourses])];
  saveTasks();
  saveCourses();
  renderCourses();
  renderTasks();
  return { importedCount: newTasks.length, skippedCount: importedTasks.length - newTasks.length };
}

downloadCalendarUrlButton.addEventListener('click', () => {
  const calendarUrl = calendarUrlInput.value.trim();
  if (!calendarUrl) {
    calendarUrlInput.reportValidity();
    return;
  }

  try {
    new URL(calendarUrl);
    window.open(calendarUrl, '_blank', 'noopener,noreferrer');
  } catch {
    calendarUrlInput.setCustomValidity('Enter a valid calendar URL.');
    calendarUrlInput.reportValidity();
    calendarUrlInput.setCustomValidity('');
  }
});

backupHistoryList.addEventListener('click', (event) => {
  const saveButton = event.target.closest('.save-backup');
  if (saveButton) {
    event.stopPropagation();
    const backup = getBackupHistory().find((item) => item.id === saveButton.dataset.backupId);
    if (!backup) return;
    useAllBackups = false;
    restoreBackup(backup.backup);
    setActiveBackup(null);
    renderBackupHistory();
    return;
  }
  const deleteButton = event.target.closest('.delete-backup');
  if (deleteButton) {
    event.stopPropagation();
    const isActiveBackup = activeBackupId === deleteButton.dataset.backupId;
    const deleteMessage = isActiveBackup
      ? 'This backup and its current tasks, courses, and settings will be permanently deleted. Continue?'
      : 'This imported backup and its saved data will be permanently deleted. Continue?';
    if (!confirm(deleteMessage)) return;
    const history = getBackupHistory().filter((backup) => backup.id !== deleteButton.dataset.backupId);
    saveBackupHistory(history);
    if (activeBackupId === deleteButton.dataset.backupId) clearCurrentAppData();
    renderBackupHistory();
    return;
  }
  const backupItem = event.target.closest('.backup-item');
  if (!backupItem) return;
  const backup = getBackupHistory().find((item) => item.id === backupItem.dataset.backupId);
  if (backup) {
    useAllBackups = false;
    restoreBackup(backup.backup);
    setActiveBackup(backup.id);
    renderBackupHistory();
  }
});

backupHistoryList.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (event.target.closest('.delete-backup') || event.target.closest('.save-backup')) return;
  const backupItem = event.target.closest('.backup-item');
  if (!backupItem) return;
  event.preventDefault();
  const backup = getBackupHistory().find((item) => item.id === backupItem.dataset.backupId);
  if (backup) {
    useAllBackups = false;
    restoreBackup(backup.backup);
    setActiveBackup(backup.id);
    renderBackupHistory();
  }
});

function resetTaskForm() {
  document.getElementById('title').value = '';
  document.getElementById('deadline').value = '';
  document.getElementById('due-time').value = '00:00';
  document.getElementById('task-note').value = '';
  customReminderMinutes.value = '';
  reminderSelect.value = '15';
  updateCustomReminder();
}

function formatCustomReminder(minutes) {
  if (minutes <= 60) return `${minutes} minutes before`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!remainingMinutes) return `${hours} hour${hours === 1 ? '' : 's'} before`;
  return `${hours}h ${remainingMinutes}m before`;
}

function formatReminder(minutes) {
  if (!minutes) return 'At the due time';
  if (minutes === 5) return '5 minutes before';
  if (minutes === 15) return '15 minutes before';
  if (minutes === 30) return '30 minutes before';
  if (minutes === 60) return '1 hour before';
  if (minutes === 300) return '5 hours before';
  if (minutes === 1440) return '1 day before';
  return formatCustomReminder(minutes);
}

function updateCustomReminder() {
  const isCustom = reminderSelect.value === 'custom';
  customReminder.hidden = !isCustom;
  customReminderMinutes.required = isCustom;
  if (!isCustom) customReminderMinutes.setCustomValidity('');

  const minutes = Number(customReminderMinutes.value);
  customReminderOption.textContent = isCustom && minutes > 0
    ? `Custom (${formatCustomReminder(minutes)})`
    : 'Custom';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

function renderCourses() {
  subjectInput.innerHTML = '<option value="">Select a course</option>';
  courses.forEach((course) => {
    const option = document.createElement('option');
    option.value = course;
    option.textContent = course;
    subjectInput.appendChild(option);
  });

  courseList.innerHTML = courses.map((course, index) => `
    <li><span>${escapeHtml(course)}</span><button class="btn-delete-course" onclick="deleteCourse(${index})" aria-label="Delete ${escapeHtml(course)}">Delete</button></li>
  `).join('');
}

function getDueDate(task) {
  if (!task.deadline) return null;
  const [year, month, day] = task.deadline.split('-').map(Number);
  const [hours, minutes] = (task.dueTime || '23:59').split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function isOverdue(task) {
  const dueDate = getDueDate(task);
  return dueDate ? dueDate.getTime() <= Date.now() : false;
}

function getTimeRemaining(task) {
  const dueDate = getDueDate(task);
  if (!dueDate || Number.isNaN(dueDate.getTime())) return 'Set due time';
  const totalSeconds = Math.max(0, Math.floor((dueDate.getTime() - Date.now()) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const stopwatchTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return days ? `${days}d ${stopwatchTime}` : stopwatchTime;
}

function updateCountdowns() {
  document.querySelectorAll('.countdown-value[data-task-index]').forEach((element) => {
    const task = tasks[Number(element.dataset.taskIndex)];
    element.textContent = getTimeRemaining(task);
    element.closest('.countdown').classList.toggle('overdue', isOverdue(task));
  });
}

function renderTaskNote(note, index) {
  const escapedNote = escapeHtml(note);
  if (note.length <= 140) return `<p class="task-note">${escapedNote}</p>`;
  const expanded = expandedTaskNotes.has(index);
  return `
    <div class="task-note-container">
      <p class="task-note${expanded ? ' task-note-expanded' : ''}">${escapedNote}</p>
      <button type="button" class="read-more-button" onclick="toggleTaskNote(${index})">${expanded ? 'Show less' : 'Read more...'}</button>
    </div>
  `;
}

function renderTasks() {
  taskList.innerHTML = '';
  const searchTerm = taskSearchInput.value.trim().toLowerCase();
  const matchingTasks = tasks
    .map((task, index) => ({ task, index }))
    .filter(({ task }) => !searchTerm || [task.title, task.subject, task.note]
      .some((value) => String(value || '').toLowerCase().includes(searchTerm)));

  if (!matchingTasks.length) {
    taskList.innerHTML = `<li class="empty-task-list">${searchTerm ? 'No tasks match your search.' : 'No tasks yet. Add your first task.'}</li>`;
    return;
  }

  matchingTasks.forEach(({ task, index }) => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    li.innerHTML = `
      <div class="task-info">
        <strong>${escapeHtml(task.title)}</strong>
        <span>Course: ${escapeHtml(task.subject)} | Due: ${task.deadline} at ${task.dueTime || '23:59'}</span>
        ${task.note ? renderTaskNote(task.note, index) : ''}
        <div class="task-reminder"><span>Reminder: ${formatReminder(task.reminderMinutes)}</span><button class="btn-edit-reminder" onclick="changeTaskReminder(${index})">Change</button></div>
        <small class="countdown${isOverdue(task) ? ' overdue' : ''}"><span class="countdown-label">Time remaining:</span> <span class="countdown-value" data-task-index="${index}">${getTimeRemaining(task)}</span></small>
      </div>
      <div class="action-btns">
        <button class="btn-complete" onclick="toggleTask(${index})">✔</button>
        <button class="btn-delete" onclick="deleteTask(${index})">✖</button>
      </div>
    `;
    taskList.appendChild(li);
  });
}

taskSearchInput.addEventListener('input', renderTasks);

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = document.getElementById('title').value;
  const subject = subjectInput.value;
  const deadline = document.getElementById('deadline').value;
  const dueTime = document.getElementById('due-time').value;
  const reminderMinutes = reminderSelect.value === 'custom'
    ? Number(customReminderMinutes.value)
    : Number(reminderSelect.value);
  if (!reminderMinutes || reminderMinutes < 1) {
    customReminderMinutes.setCustomValidity('Enter a reminder of at least 1 minute.');
    customReminderMinutes.reportValidity();
    return;
  }
  customReminderMinutes.setCustomValidity('');
  const note = document.getElementById('task-note').value.trim();

  tasks.push({ title, subject, deadline, dueTime, reminderMinutes, note, completed: false, notified: false });
  saveTasks();
  renderTasks();
  resetTaskForm();
});

reminderSelect.addEventListener('change', updateCustomReminder);
customReminderMinutes.addEventListener('input', () => {
  customReminderMinutes.setCustomValidity('');
  updateCustomReminder();
});
customReminderMinutes.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    updateCustomReminder();
  }
});

document.getElementById('add-course').addEventListener('click', () => {
  const course = courseNameInput.value.trim();
  if (!course || courses.includes(course)) return;
  courses.push(course);
  saveCourses();
  renderCourses();
  subjectInput.value = course;
  courseNameInput.value = '';
});

courseNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('add-course').click();
  }
});

toggleCourseManagerButton.addEventListener('click', () => {
  const isOpen = !courseManager.hidden;
  courseManager.hidden = isOpen;
  toggleCourseManagerButton.setAttribute('aria-expanded', String(!isOpen));
  toggleCourseManagerButton.textContent = isOpen ? '＋' : '−';
  if (!isOpen) courseNameInput.focus();
});

window.toggleTask = (index) => {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
};

window.toggleTaskNote = (index) => {
  if (expandedTaskNotes.has(index)) expandedTaskNotes.delete(index);
  else expandedTaskNotes.add(index);
  renderTasks();
};

window.deleteTask = (index) => {
  if (!confirm('Delete this task?')) return;
  expandedTaskNotes.delete(index);
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
};

window.changeTaskReminder = (index) => {
  const currentReminder = tasks[index].reminderMinutes || 0;
  const answer = prompt('Enter reminder minutes before the due time:', String(currentReminder));
  if (answer === null) return;
  const reminderMinutes = Number(answer);
  if (!Number.isInteger(reminderMinutes) || reminderMinutes < 0) {
    alert('Please enter a valid number of minutes.');
    return;
  }
  tasks[index].reminderMinutes = reminderMinutes;
  tasks[index].notified = false;
  saveTasks();
  renderTasks();
};

clearSelectedTasksButton.addEventListener('click', () => {
  const selectedFilter = clearTaskFilter.value;
  const matchingTasks = selectedFilter === 'all'
    ? tasks
    : tasks.filter((task) => selectedFilter === 'done' ? task.completed : isOverdue(task));
  const filterLabel = selectedFilter === 'all' ? 'all' : selectedFilter;
  if (!matchingTasks.length || !confirm(`Delete ${filterLabel} task${matchingTasks.length === 1 ? '' : 's'}?`)) return;
  tasks = selectedFilter === 'all'
    ? []
    : tasks.filter((task) => selectedFilter === 'done' ? !task.completed : !isOverdue(task));
  saveTasks();
  renderTasks();
});

window.deleteCourse = (index) => {
  courses.splice(index, 1);
  saveCourses();
  renderCourses();
};

function updateNotificationStatus() {
  const setStatus = (status, icon, label) => {
    notificationStatus.className = `status-${status}`;
    statusIcon.textContent = icon;
    statusText.textContent = `Status: ${label}`;
  };

  if (!browserNotificationsAvailable) {
    notificationToggle.disabled = false;
    notificationToggle.textContent = notificationsEnabled ? 'Reminder off' : 'Reminder on';
    notificationToggle.setAttribute('aria-pressed', String(notificationsEnabled));
    setStatus(notificationsEnabled ? 'on' : 'off', notificationsEnabled ? '✓' : '○', notificationsEnabled ? 'On' : 'Off');
  } else if (Notification.permission === 'granted') {
    notificationToggle.disabled = false;
    notificationToggle.textContent = notificationsEnabled ? 'Reminder off' : 'Reminder on';
    notificationToggle.setAttribute('aria-pressed', String(notificationsEnabled));
    setStatus(notificationsEnabled ? 'on' : 'off', notificationsEnabled ? '✓' : '○', notificationsEnabled ? 'On' : 'Off');
  } else if (Notification.permission === 'denied') {
    setStatus('blocked', '!', 'Blocked');
    notificationToggle.textContent = 'Reminder on';
    notificationToggle.setAttribute('aria-pressed', 'false');
    notificationToggle.disabled = true;
  } else {
    setStatus('off', '○', 'Off');
    notificationToggle.textContent = 'Reminder on';
    notificationToggle.setAttribute('aria-pressed', 'false');
    notificationToggle.disabled = false;
  }
}

notificationToggle.addEventListener('click', async () => {
  if (notificationsEnabled) {
    notificationsEnabled = false;
    localStorage.setItem('notificationsEnabled', 'false');
    updateNotificationStatus();
    return;
  }

  if (!browserNotificationsAvailable) {
    notificationsEnabled = true;
    localStorage.setItem('notificationsEnabled', 'true');
    updateNotificationStatus();
    return;
  }

  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      updateNotificationStatus();
      return;
    }
  }

  notificationsEnabled = true;
  localStorage.setItem('notificationsEnabled', 'true');
  updateNotificationStatus();
});

function checkReminders() {
  if (!notificationsEnabled) return;
  const canSendBrowserNotification = browserNotificationsAvailable && Notification.permission === 'granted';
  if (browserNotificationsAvailable && !canSendBrowserNotification) return;
  const now = Date.now();
  let changed = false;
  tasks.forEach((task) => {
    const dueDate = getDueDate(task);
    if (!dueDate || Number.isNaN(dueDate.getTime())) return;
    const reminderAt = dueDate.getTime() - (task.reminderMinutes || 0) * 60000;
    if (!task.completed && !task.notified && now >= reminderAt) {
      if (canSendBrowserNotification) {
        new Notification(`Task reminder: ${task.title}`, { body: `${task.subject} is due at ${task.dueTime || '23:59'}.` });
      } else {
        showReminderToast(task);
      }
      task.notified = true;
      changed = true;
    }
  });
  if (changed) saveTasks();
}

renderCourses();
renderTasks();
updateNotificationStatus();
renderBackupHistory();
updateCountdowns();
setInterval(() => {
  updateCountdowns();
  checkReminders();
}, 1000);