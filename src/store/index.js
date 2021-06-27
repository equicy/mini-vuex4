import { createStore } from '@/vuex'

function customPlugin(store) {
  let local = localStorage.getItem('VUEX:STATE')
  if (local) {
    store.replaceState(JSON.parse(local))
  }

  store.subscribe(({mutation}, state) => {
    localStorage.setItem('VUEX:STATE', JSON.stringify(state))
  })
}

const store = createStore({
  plugins: [ // 会将store默认传递到插件
    customPlugin
  ],
  strict: true,
  state: {
    count: 0
  },
  getters: {
    double: (state) => {
      return state.count *2
    }
  },
  mutations: {
    add(state,payload) {
      state.count += payload
    }
  },
  actions: {
    asyncAdd({ commit }, payload) {
      setTimeout(() => {
        commit('add', payload)
      }, 1000);
    }
  },
  modules: {
    aCount: {
      namespaced: true,
      state: {count: 1},
      mutations: {
        add(state,payload) {
          state.count += payload
        }
      }
    },
    bCount: {
      namespaced: true,
      state: {count: 1},
      mutations: {
        add(state,payload) {
          state.count += payload
        }
      }
    }
  }
})

store.registerModule(['aCount','cCount'], {
  namespaced: true,
  state: {
    count: 100
  },
  mutations: {
    add(state, payload) {
      state.count += payload
    }
  }
})


export default store