<template>
  <q-page class="q-pa-md">
    <p>Count : {{ count }}</p>
    <q-btn @click="increament">증가</q-btn>

    <p>Mult : {{ multi }}</p>

    <q-input v-model="message" label="메시지를 입력하세요" />

    <ul> 
      <li v-for="(item,index) in items" :key="index">{{ item }}</li>
    </ul>

    <!-- <router-link to="/">홈으로 이동</router-link>
      사용자가 클릭하면 URL 경로를 변경하고
      페이지를 이동할 수 있는 링크를 만들어줍니다 -->
    <br>
    <router-link to="/remote">원격수업</router-link>

    <p>STORE : {{ countStore.count }}</p>
    <q-btn @click="countStore.increment">스토어 증가</q-btn>
    <q-btn @click="countStore.decrement">스토어 감소</q-btn>

    <p>3곱하기 : {{ countStore.tripleCount }}</p>
    
    <p> {{ sunju.name }} - {{ sunju.age }}</p>
    <q-btn @click="decreaseAge">나이 감소</q-btn>

    <br>
    <p>사용자 이름 : {{ userStore1.user.name }}</p>
    <q-input type="text" v-model="newName"></q-input>
    <q-btn @click="userStore1.updateName(newName)">이름 변경</q-btn>
  </q-page>
  

</template>
<script setup>
import { ref , reactive, computed, watch} from 'vue'
import {useCounterStore} from '../stores/counter'
import {userStore} from '../stores/user'

const count = ref(0)

const x = ref(200)
const y = ref(300)
const newName = ref('')

const multi = computed(()=>x.value * y.value) // computed :계산된값

const message = ref('')

const items = ref(['apple', 'banana', 'orange'])

watch(message, (newVal, oldVal)=>{ //  watch(감시할 값, (새 값, 이전 값) => { ... })
  console.log('메시지 변경됨:', oldVal, '->', newVal)
})

const increament = () => {
  count.value++
  x.value++
}

const countStore =  useCounterStore()
const userStore1 = userStore()

const sunju = reactive({
  name : '성주',
  age : 31,
})

const decreaseAge = () => {
  sunju.age--
}
</script>