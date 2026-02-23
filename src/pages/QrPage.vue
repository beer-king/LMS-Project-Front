<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md"></div>

    <qrcode-vue
      :value="qrData"
      :size="200"
      level="H"
    />
    <p>사이트 주소 : {{ qrData }}</p>
  </q-page>


</template>
<script setup>
import { ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
const qrData = ref('https://www.naver.com') // QR 코드에 담길 데이터
</script>