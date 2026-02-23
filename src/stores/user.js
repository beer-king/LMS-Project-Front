import{defineStore} from 'pinia'

export const userStore = defineStore('user', {
    state: ()=>({
        user : {
            name : '홍길동',
            age : 20,
        }
    }),

    getters:{

    },

    actions:{
        updateName(newName){
            this.user.name = newName
        },

        updateAge(newAge){
            this.user.age = newAge
        }
    }
    
})