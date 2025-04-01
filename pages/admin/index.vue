<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Painel do Instrutor</h1>

    <NuxtLink
      to="/admin/novo-curso"
      class="inline-block mb-6 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
    >
      + Novo curso
    </NuxtLink>

    <h2 class="text-xl font-semibold mb-3">Seus cursos</h2>
    <ul class="space-y-3">
      <li
        v-for="curso in cursos"
        :key="curso.id"
        class="border p-4 rounded shadow flex justify-between items-center"
      >
        <div>
          <p class="font-semibold">{{ curso.title }}</p>
          <p class="text-sm text-gray-600">{{ curso.description }}</p>
        </div>
        <NuxtLink
          :to="`/admin/curso/${curso.id}`"
          class="text-blue-500 hover:underline"
        >
          Editar
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getCourses } from '~/utils/api'

const cursos = ref([])

onMounted(async () => {
  cursos.value = await getCourses()
})
</script>
