<template>
  <div class="p-6 max-w-4xl mx-auto">
    <NuxtLink to="/" class="text-sm text-purple-600 hover:underline">← Voltar</NuxtLink>

    <h1 class="text-2xl font-bold mt-4 mb-2">{{ curso.title }}</h1>
    <p class="text-gray-600 mb-6">{{ curso.description }}</p>

    <!-- Barra de progresso -->
    <div class="mb-4">
      <p class="text-sm text-gray-600 mb-1">
        📊 Progresso do curso: {{ aulasConcluidas.length }} de {{ aulas.length }} aulas concluídas ({{ percentualProgresso }}%)
      </p>
      <div class="w-full h-3 bg-gray-200 rounded">
        <div
          class="h-3 bg-blue-600 rounded transition-all"
          :style="{ width: percentualProgresso + '%' }"
        ></div>
      </div>
    </div>

    <!-- Lista de aulas -->
    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-2">Aulas</h2>
      <ul class="space-y-1">
        <li
          v-for="aula in aulas"
          :key="aula.id"
          class="cursor-pointer hover:underline flex items-center justify-between"
          :class="aulaSelecionada?.id === aula.id ? 'text-blue-600 font-medium' : 'text-gray-800'"
          @click="aulaSelecionada = aula"
        >
          <span>{{ aula.order }}. {{ aula.title }}</span>
          <span v-if="progressoPorAula[aula.id]" class="text-green-600 text-sm">✔️ Concluída</span>
        </li>
      </ul>
    </div>

    <!-- Player da aula -->
    <div v-if="aulaSelecionada" class="mb-8">
      <h3 class="text-lg font-semibold mb-2">Assistindo: {{ aulaSelecionada.title }}</h3>
      <iframe
        :src="`https://www.youtube.com/embed/${getVideoId(aulaSelecionada.youtube_url)}?enablejsapi=1`"
        frameborder="0"
        allowfullscreen
        ref="iframeRef"
        class="w-full aspect-video rounded"
      ></iframe>
      <p class="text-sm mt-2 text-gray-500">Progresso salvo automaticamente</p>
    </div>

    <!-- Quiz -->
    <div v-if="quizDisponivel" class="mt-6">
      <NuxtLink
        :to="`/quiz/${quiz.id}`"
        class="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
      >
        Fazer Avaliação do Curso
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  getCourses,
  getLessons,
  getQuiz,
  getUserProgressByCourse,
  saveProgress
} from '~/utils/api'

const route = useRoute()
const cursoId = route.params.id

const curso = ref({})
const aulas = ref([])
const aulaSelecionada = ref(null)
const iframeRef = ref(null)

const quiz = ref(null)
const quizDisponivel = ref(false)
const progressoPorAula = ref({})

const userId = '11111111-1111-1111-1111-111111111111'
const trackId = '00000000-0000-0000-0000-000000000000'

let player
let interval
let duration = 0
let lastTime = 0
let watchSegments = []

const aulasConcluidas = computed(() =>
  aulas.value.filter(a => progressoPorAula.value[a.id])
)

const percentualProgresso = computed(() => {
  if (!aulas.value.length) return 0
  return Math.round((aulasConcluidas.value.length / aulas.value.length) * 100)
})

onMounted(async () => {
  try {
    curso.value = (await getCourses()).find(c => c.id === cursoId) || {}
    aulas.value = await getLessons(cursoId)

    const progresso = await getUserProgressByCourse(userId, cursoId)
    progresso?.forEach(p => {
      progressoPorAula.value[p.lesson_id] = p.completed
    })

    const ultimaAula = progresso?.find(p => p.lesson_id)
      ? aulas.value.find(a => a.id === progresso[0].lesson_id)
      : null

    aulaSelecionada.value = ultimaAula || aulas.value[0]

    const quizzes = await getQuiz('', true)
    quiz.value = quizzes.find(q => q.context_type === 'course' && q.context_id === cursoId)
    quizDisponivel.value = !!quiz.value

    await loadYouTubeAPI()
    initPlayer()
  } catch (e) {
    console.error('Erro ao carregar dados do curso:', e)
  }
})

watch(() => aulaSelecionada.value?.id, () => {
  clearInterval(interval)
  lastTime = 0
  watchSegments = []
  initPlayer()
})

function getVideoId(url) {
  const match = url.match(/(?:v=|\/embed\/|\.be\/)([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : ''
}

function initPlayer() {
  if (!iframeRef.value) return

  if (!window.YT || !window.YT.Player) {
    console.warn('[YT] Aguardando API...')
    setTimeout(initPlayer, 500)
    return
  }

  try {
    player = new YT.Player(iframeRef.value, {
      events: {
        onReady: onPlayerReady
      }
    })
  } catch (err) {
    console.error('[YT] Erro ao inicializar player:', err)
  }
}

async function onPlayerReady() {
  try {
    duration = await player.getDuration()
    const key = `progresso_aula_${aulaSelecionada.value.id}`
    const saved = Number(localStorage.getItem(key))
    lastTime = saved || 0
    if (saved) player.seekTo(saved, true)

    interval = setInterval(async () => {
      const current = Math.floor(await player.getCurrentTime())
      localStorage.setItem(key, current)

      if (current > lastTime + 1) {
        const segment = { start: lastTime, end: current }
		
console.log('[Progresso] Enviando segmento:', {
  user_id: userId,
  track_id: trackId,
  course_id: cursoId,
  lesson_id: aulaSelecionada.value.id,
  duration: Math.floor(duration),
  segment: { start: lastTime, end: current }
})
		

        await saveProgress({
          user_id: userId,
          track_id: trackId,
          course_id: cursoId,
          lesson_id: aulaSelecionada.value.id,
          duration: Math.floor(duration),
          segment
        })

        lastTime = current
      }
    }, 5000)
  } catch (err) {
    console.error('[Player] erro:', err.message)
  }
}

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve()
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    window.onYouTubeIframeAPIReady = resolve
    document.head.appendChild(tag)
  })
}
</script>
