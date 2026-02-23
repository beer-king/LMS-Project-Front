<template>
  <q-page class="bg-grey-9 flex flex-center">
    <div id="jitsi-container" class="full-width" style="height: 80vh"></div>

    <q-page-sticky position="bottom" :offset="[18, 18]">
      <q-btn-group rounded>
        <q-btn color="negative" icon="call_end" label="수업 종료" @click="leaveClass" />
        <q-btn color="primary" icon="screen_share" label="화면 공유" @click="toggleShare" />
      </q-btn-group>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
let api = null
//const classTitle = ref('실시간 화상 강의실') // ref 사용 예시

onMounted(() => {
  // 1. Jitsi External API 스크립트 로드
  const script = document.createElement('script')
  script.src = 'https://meet.jit.si/external_api.js'
  script.async = true
  script.onload = () => initJitsi()
  document.body.appendChild(script)
})

const initJitsi = () => {
  const domain = 'meet.jit.si'
  const options = {
    roomName: 'LMS_FullStack_Class_001', // 강의실 고유 ID
    parentNode: document.querySelector('#jitsi-container'),
    configOverwrite: {
      startWithAudioMuted: true,
      disableThirdPartyRequests: true,
    },
    interfaceConfigOverwrite: {
      // 튜터를 대화면에 고정하고 학생들을 타일 형태로 배치하는 설정
      TILE_VIEW_MAX_COLUMNS: 3,
      SETTINGS_SECTIONS: ['devices', 'language', 'profile'],
    },
    userInfo: {
      displayName: '홍길동 학생', // 실제로는 로그인한 유저명 전달
    },
  }

  // eslint-disable-next-line no-undef
  api = new JitsiMeetExternalAPI(domain, options)
}

const leaveClass = () => {
  if (api) api.dispose()
  router.push('/')
}

onBeforeUnmount(() => {
  if (api) api.dispose()
})
</script>
