<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-4">Cursos Disponíveis</h1>
    <ul class="space-y-4">
      <li v-for="curso in cursos" :key="curso.id" class="border p-4 rounded shadow">
        <NuxtLink :to="`/curso/${curso.id}`" class="text-blue-600 hover:underline">
          {{ curso.title }}
        </NuxtLink>
        <p class="text-sm text-gray-600">{{ curso.description }}</p>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCourses } from '~/utils/api';

const cursos = ref([]);

onMounted(async () => {
  cursos.value = await getCourses();
});
</script>
