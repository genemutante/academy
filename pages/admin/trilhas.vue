<template>
  <div class="p-6 max-w-4xl mx-auto">
    <NuxtLink to="/admin" class="text-sm text-purple-600 hover:underline">← Voltar ao painel</NuxtLink>

    <h1 class="text-3xl font-bold mt-4 mb-6">Trilhas de Cursos</h1>

    <form @submit.prevent="criarTrilha" class="flex gap-2 mb-8">
      <input v-model="nova.title" placeholder="Título da trilha" class="border p-2 rounded w-1/3" required />
      <textarea v-model="nova.description" placeholder="Descrição" class="border p-2 rounded w-1/2" rows="1"></textarea>
      <button class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">+ Criar Trilha</button>
    </form>

    <ul class="space-y-4">
      <li v-for="t in trilhas" :key="t.id" class="border rounded p-4 shadow-sm bg-white">
        <div class="flex justify-between items-center">
          <div>
            <h2 class="text-lg font-semibold">{{ t.title }}</h2>
            <p class="text-sm text-gray-600" v-if="t.description">{{ t.description }}</p>
          </div>
          <NuxtLink :to="`/admin/trilha/${t.id}`" class="text-blue-600 hover:underline">Editar</NuxtLink>
        </div>
      </li>
    </ul>
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue'
import { getTracks, createTrack } from '~/utils/api'

const trilhas = ref([])
const nova = ref({ title: '', description: '' })

onMounted(async () => {
  trilhas.value = await getTracks()
})

async function criarTrilha() {
  const novaTrilha = 
  
await createTrack({
  title: nova.value.title,
  description: nova.value.description,
  created_by: '11111111-1111-1111-1111-111111111111'
})
  
  trilhas.value.push(novaTrilha)
  nova.value = { title: '', description: '' }
}






</script>
