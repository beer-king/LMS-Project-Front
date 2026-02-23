<template>
  <div class="video-container">
    <video ref="videoPlayer" class="video-js vjs-big-play-centered"></video>
    <div class="q-mt-md">
      <q-badge color="primary">현재 진도율: {{ progress }}%</q-badge>
      <q-linear-progress :value="progress / 100" color="primary" class="q-mt-sm" />
    </div> 
    <div v-if="showNextChapterBtn" class="q-mt-sm text-grey-7">
      현재 챕터가 종료되었습니다.
    </div>
    <q-btn
      v-if="showNextChapterBtn"
      color="primary"
      class="q-mt-md"
      label="다음으로 넘어가기"
      @click="goNextChapter"
    />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import videojs from 'video.js'
import axios from 'axios'
import { useQuasar } from 'quasar'

/* ===============================
   props & 기본 상태
================================ */
const props = defineProps(['options', 'lectureId'])
const videoPlayer = ref(null)
const progress = ref(0)
const $q = useQuasar()

let player = null

/* ===============================
   📌 구간 정책 상태값
================================ */
const totalSegments = ref(0)
const SEGMENT_SIZE = ref(0)          // 초
const SEGMENT_COMPLETE_RATIO = 0.8
const minStaySeconds = ref(0)

/* ===============================
   📌 체류 관리용 상태
================================ */
let lastSecond = null
const segmentWatchMap = new Map()
const completedSegmentSet = new Set()

/* ===============================
   📘 챕터 제어 상태
================================ */
const chapters = ref([])              // 서버에서 내려온 챕터 목록
const currentChapterIndex = ref(0)    // 현재 챕터 index (chapter_index - 1)
const showNextChapterBtn = ref(false) // 다음 버튼 표시 여부

/* ===============================
   🔥 Resume 관련 상태
================================ */
let lastSavedTime = 0       // 마지막으로 DB에 저장된 시점
const SAVE_INTERVAL = 30    // 30초 단위 저장

/*재생 중
 ├─ segment 로직 → "봤는지" 체크
 ├─ chapter end_time 도달
 │    ├─ pause()
 │    └─ 다음 버튼 표시
 └─ 버튼 클릭
      ├─ 다음 챕터 start_time 이동
      └─ 재생 재개
*/


/* ===============================
   🎬 Player Init
================================ */
onMounted(() => {

  loadChapters()

  //currentChapterIndex.value = 0

  player = videojs(videoPlayer.value, props.options, () => {

    player.on('loadedmetadata', async() => {
      const duration = Math.floor(player.duration())

      totalSegments.value = calcTargetSegments(duration) // 동영상 시간에 따른 총 구간
      SEGMENT_SIZE.value = Math.floor(duration / totalSegments.value) // 구간별 사이즈(시간)
      minStaySeconds.value = Math.ceil(SEGMENT_SIZE.value * SEGMENT_COMPLETE_RATIO) // 구간별 최소 체류시간

      console.log('📦 duration:', duration) // 동영상 재생시간
      console.log('📦 totalSegments:', totalSegments.value) // 구간정책(변경가능)
      console.log('📦 segmentSize:', SEGMENT_SIZE.value) // 구간별 크기
      console.log('📦 minStaySeconds:', minStaySeconds.value) // 한 구간을 완료로 인정하기 위한 최소 체류 시간

      const lastTime = await loadLastWatchedTime() // 이전시청위치 조회
      
      console.log('이전 시청 위치:', lastTime)

      if (lastTime && lastTime > 0) {
        player.currentTime(lastTime)
        lastSavedTime = lastTime

        $q.notify({
          message: '이전 시청 위치부터 재생합니다.',
          color: 'secondary'
        })
      }

    })

    player.on('timeupdate', async() => { // 동영상 시간 바뀔때마다 1,2초
      const currentSecond = Math.floor(player.currentTime()) // 현재 동영상 시간

      // 🔥 첫 호출 초기화
      if (lastSecond === null) {
        lastSecond = currentSecond
        return
      }

      const delta = currentSecond - lastSecond

      // 30초 단위 저장
      if (currentSecond - lastSavedTime >= SAVE_INTERVAL) {
        await saveLastWatchedTime(currentSecond)
        lastSavedTime = currentSecond
      }

      // 진행률 UI
      if (player.duration() > 0) {

        const duration = Math.floor(player.duration())

        progress.value = Math.min(
          99, Math.floor((currentSecond / duration) * 100)
        )
      }

      // ❌ seek / 배속 / 튐 방지
      if (delta <= 0 || delta > 2) {
        lastSecond = currentSecond
        handleChapterControl()
        return
      }

      /* ===============================
         📌 구간 계산 (상한 보호)
      ================================ */
      const rawIndex = Math.floor(
        currentSecond / SEGMENT_SIZE.value
      ) // 이론값

      /**
       * 영상 재생 시간으로 계산한 구간 인덱스는
         영상 종료 시 실제 구간 개수를 초과할 수 있으므로,
         Math.min()을 사용해 마지막 구간으로 보정한다.
       */
      const segmentIndex = Math.min(
        rawIndex,
        totalSegments.value - 1
      )


      // 이미 완료된 구간은 무시
      if (completedSegmentSet.has(segmentIndex)) {
        lastSecond = currentSecond
        return
      }

      // 체류 시간 누적
      const prev = segmentWatchMap.get(segmentIndex) || 0
      const next = prev + delta
      segmentWatchMap.set(segmentIndex, next)

      console.log(
        `구간 ${segmentIndex}: ${next}s / ${minStaySeconds.value}s`
      )

      // ✅ 최소 체류 달성
      if (next >= minStaySeconds.value) {
        completedSegmentSet.add(segmentIndex)
        await sendSegmentProgress(segmentIndex)
      }

      lastSecond = currentSecond

      handleChapterControl()
    })

    player.on('ended', async () => {
      progress.value = 100
      await checkCompletion()
      saveLastWatchedTime(0)
      lastSavedTime = 0
    })


    /* ===============================
       📌 pause 시 저장
    ================================ */
    player.on('pause', async() => {
      const current = Math.floor(player.currentTime())
      await saveLastWatchedTime(current)
      lastSavedTime = current
    })


    /* ===============================
     📌 페이지 이탈 시 저장
    ================================ */
    window.addEventListener('pagehide', handlePageHide)

  })
})

onBeforeUnmount(() => {
  handlePageHide()
  player?.dispose()
})


/* ===============================
   📌 페이지 종료 시점 저장
================================ */
const handlePageHide = () => {
  if (player) {
    saveLastWatchedTime(player.currentTime())
  }
}


/* ===============================
  📘 챕터 종료 감지
================================ */
const handleChapterControl = async() => {

    //console.log("======handleChapterControl======")

    const chapter = chapters.value[currentChapterIndex.value]
    //console.log("현재 챕터:", chapter)
    if (!chapter) return

    // 챕터 종료 시점 도달
    if (
      player.currentTime() >= chapter.endSec &&
      !showNextChapterBtn.value
    ) {
      player.pause()

      // ✅ 챕터 진도 저장
      sendChapterProgress(chapter)

      // 🔥 마지막 챕터면 바로 수료
      if (currentChapterIndex.value === chapters.value.length - 1) {
          progress.value = 100
          await checkCompletion()
          await saveLastWatchedTime(0)
          return
      }

      showNextChapterBtn.value = true
    }
}

/**
 * 🔥 이전 시청 위치 조회
 */
const loadLastWatchedTime = async () => {
  try {
    const res = await axios.get(
      `http://localhost:8080/api/progress/resume/${props.lectureId}`,
      {
        params: { userId: 'test_user_01' }
      }
    )
    return res.data.lastWatchedTime
  } catch (e) {
    console.error('이전시청시간 조회 실패', e)
    return 0
  }
}

/**
 * 🔥 현재 시청 위치 저장
 */
const saveLastWatchedTime = async (time) => {
  try {
    await axios.post(
      'http://localhost:8080/api/progress/resume',
      {
        userId: 'test_user_01',
        lectureId: props.lectureId,
        lastWatchedTime: Math.floor(time)
      }
    )
  } catch (e) {
    console.error('resume 저장 실패', e)
  }
}

/* ===============================
   📘 챕터 로드
   ==============================
*/
const loadChapters = async () => {
  const res = await axios.get(
    `http://localhost:8080/api/lecture/chapters/${props.lectureId}`,
    
  )

  // chapter_index 기준 정렬
  chapters.value = res.data.sort(
    (a, b) => a.chapterIndex - b.chapterIndex // 오름차순 정렬 패턴
  )

   currentChapterIndex.value = 0
  console.log("챕터 데이터 : " + JSON.stringify(chapters.value))
}

// 다음 챕터로 이동
const goNextChapter = async() => {
  showNextChapterBtn.value = false

  currentChapterIndex.value++

  const nextChapter = chapters.value[currentChapterIndex.value]

  // 다음 챕터 시작 지점으로 이동
  player.currentTime(nextChapter.startSec)
  player.play()
}

// 마지막 챕터인지 확인
/*const isLastChapter = () => {
  console.log("현재 index:", currentChapterIndex.value)
  console.log("챕터 길이:", chapters.value.length)
  return currentChapterIndex.value === chapters.value.length - 1
}*/

const sendChapterProgress = async (chapter) => {
  await axios.post(
    'http://localhost:8080/api/lecture/chapter/progress',
    {
      userId: 'test_user_01',
      lectureId: props.lectureId,
      chapterId: chapter.chapterId,
      chapterIndex: chapter.chapterIndex
    }
  )
}

/* ===============================
   📡 서버 통신
================================ */
const sendSegmentProgress = async (segmentIndex) => {
  await axios.post(
    'http://localhost:8080/api/progress/segment',
    {
      userId: 'test_user_01',
      lectureId: props.lectureId,
      segmentIndex,
      totalSegments: totalSegments.value
    }
  )
}

/* ===============================
   📊 구간 정책 함수
================================ */
const calcTargetSegments = (durationSec) => {
  if (durationSec <= 60) return 5
  if (durationSec <= 300) return 10
  if (durationSec <= 1800) return 15
  return 20
}

/* ===============================
   🎓 수료 체크
================================ */
const checkCompletion = async () => {
  const res = await axios.post(
    'http://localhost:8080/api/progress/complete/check',
    {
      userId: 'test_user_01',
      lectureId: props.lectureId
    }
  )

  if (res.data.completed) {
    $q.dialog({
      title: '수료 완료',
      message: '강의를 모두 시청하였습니다.',
      ok: '확인'
    })
  }
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
