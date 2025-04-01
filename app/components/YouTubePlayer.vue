<template>
  <div>
    <div :id="playerId" class="w-full aspect-video rounded overflow-hidden"></div>
    <p class="text-sm mt-2 text-gray-600">Progresso salvo automaticamente</p>
  </div>
</template>

<script setup>
import { onMounted, watch, ref } from 'vue'

const props = defineProps({
  videoId: String,
  uniqueId: String
})

const player = ref(null)
const interval = ref(null)

const playerId = `yt-player-${props.uniqueId}`
const storageKey = `progresso_${props.uniqueId}`

onMounted(() => {
  if (process.client) {
    loadYouTubeAPI().then(() => {
      player.value = new window.YT.Player(playerId, {
        height: '390',
        width: '640',
        videoId: props.videoId,
        events: {
          onReady: onPlayerReady
        }
      })
    })
  }
})

function onPlayerReady() {
  const savedTime = Number(localStorage.getItem(storageKey))
  if (savedTime) {
    player.value.seekTo(savedTime, true)
  }

  interval.value = setInterval(() => {
    if (player.value && player.value.getCurrentTime) {
      const time = player.value.getCurrentTime()
      localStorage.setItem(storageKey, Math.floor(time))
    }
  }, 3000)
}

watch(() => props.uniqueId, () => {
  clearInterval(interval.value)
})

function loadYouTubeAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve()

    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      resolve()
    }
  })
}
</script>
