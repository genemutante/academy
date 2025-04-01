<template>
  <div class="p-6 max-w-4xl mx-auto">
    <NuxtLink to="/" class="text-sm text-purple-600 hover:underline">← Voltar</NuxtLink>

    <h1 class="text-2xl font-bold mt-4 mb-2">{{ trilha.title }}</h1>
    <p class="text-gray-600 mb-8">{{ trilha.description }}</p>

    <h2 class="text-xl font-semibold mb-4">Cursos da Trilha</h2>
    <ul class="space-y-2">
      <li v-for="curso in cursos" :key="curso.id">
        <NuxtLink
          :to="`/curso/${curso.id}`"
          class="block p-3 border rounded hover:bg-gray-50"
        >
          <h3 class="font-semibold">{{ curso.title }}</h3>
          <p class="text-sm text-gray-600">{{ curso.description }}</p>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { getTracks, getTrackCourses } from '~/utils/api'

const route = useRoute()
const trilhaId = route.params.id

const trilha = ref({ title: '', description: '' })
const cursos = ref([])

onMounted(async () => {
  const trilhas = await getTracks()
  trilha.value = trilhas.find(t => t.id === trilhaId) || {}

  cursos.value = await getTrackCourses(trilhaId)
})
</script>
