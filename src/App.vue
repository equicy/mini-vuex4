<template>
  {{ count }} {{double}}
  <button @click="$store.state.count++">错误修改</button>
  <button @click="add">同步修改</button>
  <button @click="asyncAdd">异步修改</button>

  <hr>
  模块 {{ aCount }} {{ bCount }} {{ cCount }}
  <button @click="$store.commit('aCount/add', 1)">改a</button>
  <button @click="$store.commit('bCount/add', 1)">改b</button>
  <button @click="$store.commit('aCount/cCount/add', 1)">改c</button>
</template>

<script>
import { useStore } from '@/vuex'
import { computed } from 'vue'
export default {
  name: 'App',

  setup() {
    const store = useStore()
    const add = () => {
      store.commit('add', 1)
    }

    console.log(store.state.aCount)

    const asyncAdd = () => {
      store.dispatch('asyncAdd', 2)
    }
    return {
      count: computed(() => store.state.count),
      double: computed(() => store.getters.double),
      aCount: computed(() => store.state.aCount.count),
      bCount: computed(() => store.state.bCount.count),
      cCount: computed(() => store.state.aCount.cCount.count),
      add,
      asyncAdd
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
