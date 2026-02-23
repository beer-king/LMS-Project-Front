<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />
        <q-toolbar-title> 온라인 교육 시스템 (LMS) </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <q-list>
        <q-item-label header> LMS 강좌 목록 </q-item-label>

        <q-item
          v-for="(lecture, index) in lectureList"
          :key="lecture.id"
          clickable
          v-ripple
          :active="currentLecture.id === lecture.id"
          @click="selectLecture(lecture)"
        >
          <q-item-section avatar>
            <q-icon :name="currentLecture.id === lecture.id ? 'play_circle' : 'lock_open'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ index + 1 }}. {{ lecture.title }}</q-item-label>
            <q-item-label caption>{{ lecture.duration }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view :lecture-data="currentLecture" />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const leftDrawerOpen = ref(false)

// 1. 강의 목록 데이터 (10개 예시)
const lectureList = [
  { id: 'LEC_001', title: '1강: 바다 풍경 감상', url: 'https://vjs.zencdn.net/v/oceans.mp4' },
  {
    id: 'lec_02',
    title: '2강: 애니메이션 입문',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  },
  {
    id: 'lec_03',
    title: '3강: 단편 영화 시청',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  },
  {
    id: 'lec_04',
    title: '4강: 짧은 로딩 테스트',
    url: 'http://techslides.com/demos/sample-videos/small.mp4',
  },
  {
    id: 'lec_05',
    title: '5강: 자연의 신비',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  },
  {
    id: 'lec_06',
    title: '6강: 우주 이야기',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  },
  {
    id: 'lec_07',
    title: '7강: 속도와 열정',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  },
  {
    id: 'lec_08',
    title: '8강: 기술의 발전',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  },
  {
    id: 'lec_09',
    title: '9강: 즐거운 일상',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  },
  {
    id: 'lec_10',
    title: '10강: 학습 마무리',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  },
]

const currentLecture = ref(lectureList[0]) // 기본값: 1강

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

// 강의 선택 함수
const selectLecture = (lecture) => {
  currentLecture.value = lecture
  //console.log('선택된 강의:', lecture.title);
}
</script>
