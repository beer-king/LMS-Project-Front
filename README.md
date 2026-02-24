# lms-app (lms-project)

단순 재생 완료가 아닌, 실제 시청 여부를 검증하는 LMS형 수료 시스템을 설계하고 구현했봤다.

#왜 만들었는가
프로젝트에서 동영상강의 관련 업무가 있어 미리 연습삼아 시도
처음으로 생각한 수료방식 : 영상이 끝까지 재생되면 수료 처리한다.

하지만 이 방식은:
영상 끝으로 seek(점프)해도 수료 가능
실제 시청 여부를 검증할 수 없음
Resume(이어보기) 데이터가 쉽게 깨짐

그래서 “실제로 봤는가?”를 기준으로 판단하는 구조를 만들어보기로했다. ex)법정의무교육

================전체구조================

Frontend (Vue + Player)
        ↓
        
Backend (Spring + MyBatis)
        ↓
        
MySQL (
      lecture(강의(동영상) 기본 정보)
      lecture_chapter(강의별 챕터 정의(수동 시간 입력))
      lecture_chapter_progress(사용자별 강의 챕터 시청 진행 상태)
      lecture_progress(강의별 세그먼트)
      lecture_progress_segment(세그먼트별 상태)
      )
   
1.Segment 기반 체류 검증
문제
영상 끝으로 이동(seek)하면 수료되는 구조는 의미가 없음.

해결
영상을 여러 개의 Segment로 나누고,
각 구간에서 최소 80% 이상 체류해야 완료로 인정하도록 설계했봤다.

핵심 로직
1.영상 길이에 따라 segment 개수 동적 계산
2.timeupdate 이벤트에서 실제 체류 시간(delta) 계산
3.비정상 이동(delta > 2초, 음수 등)은 무효 처리
4.기준 이상 체류 시 서버에 완료 전송

이 방식으로 단순 점프 재생만으로는 수료할 수 없도록 했습니다.

2.Chapter 기반 학습 흐름 제어
강의를 챕터 단위로 관리해보자.

각 챕터는: start_time/end_time/chapter_index (1부터 시작)

동작 방식
1.현재 재생 위치가 chapter.end_time에 도달하면 자동 감지
2.서버에 챕터 완료 전송
3.마지막 챕터라면 자동 수료 처리

마지막 영상에서 98%에서 멈추는 문제를 해결하기 위해
player.on('ended')에서도 수료 검증을 수행하도록 설계 및 영상진도율 계산식 추가

3.Resume(이어보기) 안정 설계
이어보기 기능은 단순 저장이 아니라,
데이터 무결성 유지가 더 중요하다고 생각했다.

저장 정책
1.30초 이상 시청 시 자동 저장
2.pause 시 저장
3.pagehide 시 저장
4.수료 시 0초로 초기화

진도 후퇴 방지 쿼리(중요!!)
UPDATE lecture_progress
SET last_watched_time = ?
WHERE user_id = ?
AND lecture_id = ?
AND last_watched_time < ? --> 여기가 핵심
!!이미 더 많이 본 기록이 있다면 덮어쓰지 않도록 만듬!!

기술 스택
Vue 3, quasar, Video.js, Spring Boot, MyBatis, MySQL

이 프로젝트에서 배운 점
1.영상 학습 시스템은 생각보다 상태 관리가 복잡하다
2.DB설계는 어렵다
3.수료 기준은 기술 문제가 아니라 정책 문제에 가깝다
4.vue3와 좀더 친해졌다.
5.chat gpt는 최대한 내 의견을 상세히 말해주자.
