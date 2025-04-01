<template>
  <div class="p-6 max-w-3xl mx-auto">
    <NuxtLink to="/" class="text-sm text-blue-500 hover:underline">← Voltar</NuxtLink>

    <h1 class="text-2xl font-bold my-4">Avaliação</h1>

    <div v-if="!resultado">
      <form @submit.prevent="enviarQuiz">
        <div
          v-for="pergunta in perguntas"
          :key="pergunta.id"
          class="mb-6 border p-4 rounded"
        >
          <p class="font-semibold mb-2">{{ pergunta.text }}</p>
          <div class="space-y-2">
            <label
              v-for="opcao in pergunta.options"
              :key="opcao.id"
              class="block"
            >
              <input
                type="radio"
                :name="pergunta.id"
                :value="opcao.id"
                v-model="respostas[pergunta.id]"
              />
              {{ opcao.text }}
            </label>
          </div>
        </div>

        <button
          type="submit"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enviar respostas
        </button>
      </form>
    </div>

    <div v-else class="text-center">
      <h2 class="text-xl font-semibold mb-4">Resultado</h2>
      <p class="text-lg">Você acertou <strong>{{ resultado.score }}</strong> de <strong>{{ resultado.total }}</strong> perguntas.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getQuiz, submitQuiz } from '~/utils/api'

// --- STATE
const route = useRoute()
const quizId = route.params.quizId
const perguntas = ref([])
const respostas = ref({})
const resultado = ref(null)

// --- ON LOAD
onMounted(async () => {
  perguntas.value = await getQuiz(quizId)

  // inicializa v-model de respostas
  perguntas.value.forEach(p => {
    respostas.value[p.id] = null
  })
})

// --- SUBMIT
async function enviarQuiz() {
  const payload = {
    userId: '22222222-2222-2222-2222-222222222222', // Maria Aluna
    quizId: quizId,
    answers: Object.entries(respostas.value).map(([question_id, option_id]) => ({
      question_id,
      option_id
    }))
  }

  resultado.value = await submitQuiz(payload)
}
</script>
