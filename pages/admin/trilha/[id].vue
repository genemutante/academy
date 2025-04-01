<template>
  <div class="p-6 max-w-4xl mx-auto">
    <NuxtLink to="/admin/trilhas" class="text-sm text-purple-600 hover:underline">← Voltar às trilhas</NuxtLink>

    <h1 class="text-2xl font-bold mt-4 mb-6">Editar Trilha</h1>

    <!-- Dados da Trilha -->
    <div class="mb-8">
      <label class="block font-medium mb-1">Título</label>
      <input v-model="trilha.title" class="w-full border p-2 rounded" disabled />
    </div>

    <div class="mb-8">
      <label class="block font-medium mb-1">Descrição</label>
      <textarea v-model="trilha.description" class="w-full border p-2 rounded" disabled></textarea>
    </div>

    <!-- Cursos Associados -->
    <div class="mt-10">
      <h2 class="text-xl font-semibold mb-4">Cursos Associados</h2>

      <ul class="space-y-4 mb-6">
        <li
          v-for="curso in cursos"
          :key="curso.id"
          class="border rounded p-3 bg-gray-50 flex justify-between items-start"
        >
          <div>
            <p class="font-medium text-gray-900">{{ curso.courses.title }}</p>
            <p class="text-sm text-gray-600">{{ curso.courses.description }}</p>
          </div>
          <button
            @click="removerCurso(curso.id)"
            class="text-red-600 hover:underline text-sm"
          >
            ❌ Remover
          </button>
        </li>
      </ul>

      <!-- Adicionar Curso -->
      <form @submit.prevent="adicionarCurso" class="flex gap-2 items-end">
        <select v-model="cursoSelecionado" class="border p-2 rounded w-full">
          <option disabled value="">Selecione um curso</option>
          <option
            v-for="curso in todosCursos"
            :key="curso.id"
            :value="curso.id"
            :disabled="cursos.some(c => c.course_id === curso.id)"
          >
            {{ curso.title }}
          </option>
        </select>
        <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Adicionar Curso
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import {
  getCourses,
  getTrackCourses,
  createTrackCourse,
  deleteTrackCourse,
  getTracks
} from '~/utils/api'

const route = useRoute()
const trilhaId = route.params.id

const trilha = ref({ title: '', description: '' })
const cursos = ref([])
const todosCursos = ref([])
const cursoSelecionado = ref('')

onMounted(async () => {
  const tracks = await getTracks()
  trilha.value = tracks.find(t => t.id === trilhaId) || {}

  cursos.value = await getTrackCourses(trilhaId)
  todosCursos.value = await getCourses()
})

async function adicionarCurso() {
  if (!cursoSelecionado.value) return

  const novoCurso = await createTrackCourse({
    track_id: trilhaId,
    course_id: cursoSelecionado.value
  })

  cursos.value.push(novoCurso)
  cursoSelecionado.value = ''
}

async function removerCurso(trackCourseId) {
  const confirmado = confirm('Tem certeza que deseja remover este curso da trilha?')
  if (!confirmado) return

  await deleteTrackCourse(trackCourseId)
  cursos.value = cursos.value.filter(c => c.id !== trackCourseId)
}
</script>
