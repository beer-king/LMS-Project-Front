import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
    state: () => ({
        count: 0,
        value : 10,
    }),
    getters: {
        doubleCount: (state) => state.count * 2,
        tripleCount: (state) => state.count *3,
    },
    actions: {
        increment() {
            this.count++
        },

        decrement(){
            this.count--
        }
    }
})
