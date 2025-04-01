const BASE = 'http://localhost:8888/.netlify/functions';


// 📚 CURSOS
export const getCourses = async () =>
  fetch(`${BASE}/get-courses`).then(res => res.json())

export const createCourse = async (payload) =>
  fetch(`${BASE}/create-course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json())

// 🎓 AULAS
export const getLessons = async (courseId) =>
  fetch(`${BASE}/get-lessons?courseId=${courseId}`).then(res => res.json())

export const createLesson = async (payload) =>
  fetch(`${BASE}/create-lesson`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json())

// 📝 QUIZ
export const getQuiz = async (quizId = '', withAnswers = false) => {
  const params = new URLSearchParams()
  if (quizId) params.append('quizId', quizId)
  if (withAnswers) params.append('withAnswers', 'true')

  return fetch(`${BASE}/get-quiz?${params.toString()}`).then(res => res.json())
}

export const createQuiz = async (payload) =>
  fetch(`${BASE}/create-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json())

export const createQuestion = async (payload) =>
  fetch(`${BASE}/create-question`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json())

export const createOption = async (payload) =>
  fetch(`${BASE}/create-option`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json())

export const submitQuiz = async (payload) =>
  fetch(`${BASE}/submit-quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json())

// 🧭 TRILHAS
export const getTracks = async () =>
  fetch(`${BASE}/get-tracks`).then(res => res.json())

export const createTrack = async (payload) =>
  fetch(`${BASE}/create-track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json())

export const updateTrackCourses = async (trackId, courseIds) =>
  fetch(`${BASE}/update-track-courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackId, courseIds })
  }).then(res => res.json())

export const getTrackCourses = async (trackId) =>
  fetch(`${BASE}/get-track-courses?id=${trackId}`).then(res => res.json())

export const createTrackCourse = async (payload) =>
  fetch(`${BASE}/create-track-course`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json())

export const deleteTrackCourse = async (id) =>
  fetch(`${BASE}/delete-track-course?id=${id}`, {
    method: 'DELETE'
  }).then(res => res.json())

// 📈 PROGRESSO
export const saveProgress = async ({ user_id, track_id, course_id, lesson_id, duration, segment }) => {
  const res = await fetch(`${BASE}/save-progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, track_id, course_id, lesson_id, duration, segment })
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error('[saveProgress] Erro ao salvar progresso:', errorText)
    throw new Error('Erro ao salvar progresso')
  }

  return res.json()
}

export const getUserProgress = async (user_id, course_id) =>
  fetch(`${BASE}/get-user-progress?user_id=${user_id}&course_id=${course_id}`).then(res => res.json())

export const getUserProgressByCourse = async (user_id, course_id) =>
  fetch(`${BASE}/get-user-progress-by-course?user_id=${user_id}&course_id=${course_id}`).then(res => res.json())
