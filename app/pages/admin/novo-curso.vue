<template>
  <div class="p-8 max-w-xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Novo Curso</h1>

    <form @submit.prevent="criarCurso" class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">Título</label>
        <input v-model="titulo" type="text" class="w-full border p-2 rounded" required />
      </div>

      <div>
        <label class="block text-sm font-medium mb-1">Descrição</label>
        <textarea v-model="descricao" class="w-full border p-2 rounded" required></textarea>
      </div>

      <button
        type="submit"
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Criar Curso
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createCourse } from '~/utils/api'

const router = useRouter()
const titulo = ref('')
const descricao = ref('')

async function criarCurso() {
  const newCourse = await createCourse({
    title: titulo.value,
    description: descricao.value,
    created_by: '11111111-1111-1111-1111-111111111111' // ID fixo do instrutor
  })

  router.push(`/admin/curso/${newCourse.id}`)
}
</script>
