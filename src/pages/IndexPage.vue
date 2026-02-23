<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">{{ props.lectureData.title }}</div>

    <VideoPlayer
      :key="props.lectureData.id"
      :options="videoOptions"
      :lecture-id="props.lectureData.id"
    />
  </q-page>
</template>

<script setup>
import { computed } from 'vue'
import VideoPlayer from 'components/VideoPlayer2.vue'

// 부모(MainLayout)로부터 강의 데이터를 받음
const props = defineProps({
  lectureData: Object,
})

// 영상 옵션을 computed로 관리하여 데이터가 바뀌면 자동 반영
const videoOptions = computed(() => ({
  autoplay: true,
  controls: true,
  fluid: true,
  playbackRates: [0.5, 1], // 배속 옵션
  sources: [
    {
      src: props.lectureData.url,
      type: 'video/mp4',
    },
  ],
}))
</script>
