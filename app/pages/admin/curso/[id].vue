<template>
  <div class="p-6 max-w-4xl mx-auto">
    <NuxtLink to="/admin" class="text-sm text-blue-500 hover:underline">← Voltar</NuxtLink>

    <h1 class="text-2xl font-bold mt-4 mb-6">Editar Curso</h1>

    <!-- CURSO -->
    <div class="mb-8">
      <label class="block font-medium mb-1">Título</label>
      <input v-model="curso.title" class="w-full border p-2 rounded" disabled />
    </div>

    <div class="mb-8">
      <label class="block font-medium mb-1">Descrição</label>
      <textarea v-model="curso.description" class="w-full border p-2 rounded" disabled></textarea>
    </div>

    <!-- AULAS -->
    <div class="mt-10">
      <h2 class="text-xl font-semibold mb-2">Aulas</h2>
      <ul class="mb-4 space-y-1">
        <li v-for="aula in aulas" :key="aula.id">
          {{ aula.order }}. {{ aula.title }}
        </li>
      </ul>

      <form @submit.prevent="adicionarAula" class="space-y-3">
        <input v-model="novaAula.title" class="w-full border p-2 rounded" placeholder="Título da aula" required />
        <input v-model="novaAula.youtube_url" class="w-full border p-2 rounded" placeholder="Link do YouTube" required />
        <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Adicionar Aula</button>
      </form>
    </div>

    <!-- QUIZ -->
    <div class="mt-10 border-t pt-8">
      <h2 class="text-xl font-semibold mb-4">Quiz do Curso</h2>

      <div v-if="!quizCriado">
        <input v-model="tituloQuiz" class="w-full border p-2 rounded mb-2" placeholder="Título do quiz" />
        <button @click="criarQuiz" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Criar quiz</button>
      </div>

      <div v-else>
        <h3 class="font-semibold mb-2">{{ quiz.title }}</h3>

        <!-- Formulário de pergunta -->
        <form @submit.prevent="adicionarPergunta" class="space-y-2 mb-4">
          <input v-model="pergunta.text" class="w-full border p-2 rounded" placeholder="Texto da pergunta" required />
          <input v-model.number="pergunta.weight" type="number" class="w-full border p-2 rounded" placeholder="Peso (padrão 1)" />

          <div class="grid grid-cols-1 gap-2">
            <div v-for="(op, i) in pergunta.options" :key="i" class="flex gap-2 items-center">
              <input v-model="op.text" class="flex-1 border p-2 rounded" placeholder="Alternativa" />
              <input type="radio" :value="i" v-model="pergunta.certa" /> Correta
            </div>
          </div>

          <button class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">+ Adicionar Pergunta</button>
        </form>

        <!-- Perguntas criadas -->
        <ul class="space-y-3">
          <li v-for="q in perguntas" :key="q.id" class="p-3 border rounded">
            <p class="font-semibold">{{ q.text }} <span class="text-xs text-gray-500">({{ q.weight }} pt)</span></p>
            <ul class="text-sm ml-4 list-disc">
              <li v-for="opt in q.options" :key="opt.id" :class="opt.is_correct ? 'text-green-600 font-semibold' : ''">
                {{ opt.text }}
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  getCourses,
  getLessons,
  createLesson,
  getQuiz,
  createQuiz,
  createQuestion,
  createOption
} from '~/utils/api'

const route = useRoute()
const cursoId = route.params.id

// Curso e aulas
const curso = ref({ title: '', description: '' })
const aulas = ref([])
const novaAula = ref({ title: '', youtube_url: '' })

// Quiz
const quiz = ref(null)
const quizCriado = ref(false)
const tituloQuiz = ref('Avaliação Final')
const perguntas = ref([])

const pergunta = ref({
  text: '',
  weight: 1,
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  certa: 0
})

onMounted(async () => {
  const cursos = await getCourses()
  curso.value = cursos.find(c => c.id === cursoId) || { title: '', description: '' }

  aulas.value = await getLessons(cursoId)

  const quizzes = await getQuiz('', true)
  const q = quizzes.find(q => q.context_type === 'course' && q.context_id === cursoId)

  if (q) {
    quiz.value = q
    quizCriado.value = true
    perguntas.value = await getQuiz(q.id, true)
  }
})

async function adicionarAula() {
  const ordem = aulas.value.length + 1
  const nova = await createLesson({ ...novaAula.value, course_id: cursoId, order: ordem })
  aulas.value.push(nova)
  novaAula.value = { title: '', youtube_url: '' }
}

async function criarQuiz() {
  quiz.value = await createQuiz({
    context_type: 'course',
    context_id: cursoId,
    title: tituloQuiz.value
  })
  quizCriado.value = true
}

async function adicionarPergunta() {
  const nova = await createQuestion({
    quiz_id: quiz.value.id,
    text: pergunta.value.text,
    weight: pergunta.value.weight || 1
  })

  const options = await Promise.all(
    pergunta.value.options.map((opt, index) =>
      createOption({
        question_id: nova.id,
        text: opt.text,
        is_correct: index === pergunta.value.certa
      })
    )
  )

  nova.options = options
  perguntas.value.push(nova)

  pergunta.value = {
    text: '',
    weight: 1,
    options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
    certa: 0
  }
}
</script>
