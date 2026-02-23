<template>
  <div class="video-container">
    <video ref="videoPlayer" class="video-js vjs-big-play-centered"></video>
    <div class="q-mt-md">
      <q-badge color="primary">현재 진도율: {{ progress }}%</q-badge>
      <q-linear-progress :value="progress / 100" color="primary" class="q-mt-sm" />
    </div> 
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import videojs from 'video.js'
import { useQuasar } from 'quasar'
import axios from 'axios'

const props = defineProps(['options', 'lectureId'])
const videoPlayer = ref(null)
const progress = ref(0)
let player = null
const $q = useQuasar()

onMounted(() => {
  const lastTime = ref(0)

  // 플레이어 초기화
  player = videojs(videoPlayer.value, props.options, () => {
    console.log('플레이어 준비 완료')

    // 1. 직전 진도 불러오기 (로컬 스토리지 예시)
    // 실제 서비스에서는 여기서 백엔드 API를 호출하여 시청 기록을 가져옵니다.
    const savedTime = localStorage.getItem(`lecture_progress_${props.lectureId}`)

    if (savedTime) {
      // 저장시점이 최근시점으로 저장
      lastTime.value = savedTime

      console.log('play init lastTime : ', lastTime.value)
      if ($q.notify) {
        $q.notify({
          message: '이전 시청 지점부터 재생합니다.',
          color: 'secondary',
          position: 'top',
          timeout: 2000,
          actions: [
            {
              label: '처음부터',
              color: 'white',
              handler: () => {
                player.currentTime(0)
              },
            },
          ],
        })
      }
      player.currentTime(parseFloat(savedTime))
    }

    // 마지막 저장된 초
    const lastSavedSecond = ref(-1)
    // 2. 진도율 실시간 업데이트 및 저장
    player.on('timeupdate', () => {
      const currentTime = player.currentTime()
      const currentSecond = Math.floor(currentTime)
      //console.log('###############################')
      //console.log('play on lastTime : ', lastTime.value)
      //console.log('play on currentTime : ', currentTime)

      // (네트워크 지연 등을 고려해 2초 정도의 여유를 줍니다)
      if (currentTime - lastTime.value > 2) {
        player.currentTime(lastTime.value) // 강제로 이전 지점으로 복구

        $q.notify({
          message: '아직 시청하지 않은 구간으로 건너뛸 수 없습니다.',
          type: 'warning',
          position: 'top',
          timeout: 1500,
        })
      } else {
        // 정상적인 시청 중이라면 lastTime을 현재 시간으로 갱신
        // 단, 뒤로 가기(Rewind)는 허용하기 위해 currentTime이 더 클 때만 갱신

        if (currentTime > lastTime.value) {
          lastTime.value = currentTime
        }
      }

      const duration = player.duration()

      if (duration > 0) {
        progress.value = Math.floor((currentTime / duration) * 100)
      }

      // 10초마다 또는 특정 주기마다 진도 저장 (서버 부하 방지)

      //if (Math.floor(currentTime) % 60 === 0) {
      if (
        currentSecond !== 0 &&
        currentSecond % 10 === 0 &&
        currentSecond !== lastSavedSecond.value
      ) {
        // 로컬스토로지 저장 방식
        //localStorage.setItem(`lecture_progress_${props.lectureId}`, currentTime.toString())
        lastSavedSecond.value = currentSecond // 현재 초를 저장된 초로 업데이트하여 중복 차단
        // 진도정보 서버전송
        saveProgressToServer(currentTime)
        // console.log('진도 저장됨:', currentTime);
      }
    })

    // 3. 시청 완료 시 처리
    player.on('ended', () => {
      localStorage.setItem(`lecture_progress_${props.lectureId}`, '0') // 완료 시 초기화하거나 완료 플래그 전송
      $q.dialog({
        title: '학습 완료',
        message: '강의 시청을 완료하였습니다. 다음 강의로 넘어갈까요?',
        ok: '다음 강의',
        cancel: '닫기',
      })
    })

    /*
    // 1. 시청 시간 변경 감지 (진도율 체크용)
    player.on('timeupdate', () => {
      const currentTime = player.currentTime()
      const duration = player.duration()
      const progress = (currentTime / duration) * 100

      console.log(`현재 진행률: ${progress.toFixed(2)}%`)

      // 여기서 백엔드 API로 진도율을 보낼 수 있습니다.
    })

    // 2. 시청 완료 감지
    player.on('ended', () => {
      alert('강의 시청이 완료되었습니다!')
    })

*/
  })
})

onBeforeUnmount(() => {
  // 페이지를 나갈 때 플레이어 자원 해제 (메모리 누수 방지)
  if (player) {
    player.dispose()
  }
})

// 진도 저장 함수
const saveProgressToServer = (time) => {
  axios
    .post('http://localhost:8080/api/progress/save', {
      userId: 'test_user_01', // 실제로는 로그인한 유저 ID 사용
      lectureId: props.lectureId,
      currentTime: time,
    })
    .catch((err) => console.error('진도 저장 실패', err))
}
</script>

<style scoped>
.video-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
/* 플레이어 크기 조정 */
.video-js {
  width: 100%;
  height: 450px;
}
.vjs-play-progress {
  background-color: #2196f3 !important; /* 이미 본 구간 색상 */
}
</style>
