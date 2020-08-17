import Vuex from "vuex";
import axios from "axios";

const createStore = () => {
  return new Vuex.Store({
    state: {
      loadedPosts: [],
      token: null
    },
    mutations: {
      setPosts(state, posts) {
        state.loadedPosts = posts;
      },
      addPost(state, post) {
        state.loadedPosts.push(post)
      },
      editPost(state, editedPost) {
        const postIndex = state.loadedPosts.findIndex(
          post => post.id === editedPost.id
        );
        state.loadedPosts[postIndex] = editedPost
      },
      setToken(state, token) {
        state.token = token
      }
    },
    actions: {
      nuxtServerInit(vuexContext, context) {
        return axios.get(process.env.baseUrl +  "/posts.json")
          .then(res => {
              const postsArray = []
              for (const key in res.data) {
                postsArray.push({ ...res.data[key], id: key })
              }
              vuexContext.commit('setPosts', postsArray)
            })
          .catch(e => context.error(e));
      },
      /* 
          そのままだとVuexの値が更新されないため、更新後の画面を表示した時
          リロードしない限り新しい値が取得されない
          更新後の値を取得するため、Vuexを使用して値を常に更新するようにする
       */
      addPost(vuexContext, post) {
        const createdPost = {
          ...post,
          updatedDate: new Date()
        }
        return axios
          .post(process.env.baseUrl + "/posts.json?auth=" + vuexContext.state.token, createdPost)
          .then(result => {
            vuexContext.commit('addPost', { ...createdPost, id: result.data.name })
          })
      },
      editPost(vuexContext, editedPost) {
        /*
          <Firebase IDトークンにて認証するやり方>
            https://firebase.google.com/docs/database/rest/auth?hl=ja#authenticate_with_an_id_token
         */
        console.log(vuexContext.state.token);
        return axios.put(process.env.baseUrl + "/posts/" + editedPost.id + ".json?auth=" + vuexContext.state.token, editedPost)
          .then(res => {
            vuexContext.commit("editPost", editedPost)
          })
          .catch(e => console.log(e))
      },
      setPosts(vuexContext, posts) {
        vuexContext.commit("setPosts", posts);
      },
      authenticateUser(vuexContext, authData) {
        // 詳しくはFirebase の REST APIを確認すること
        // https://firebase.google.com/docs/reference/rest/auth#section-create-email-password
        let authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + process.env.fbAPIKey
        if (!authData.isLogin) {
          authUrl = 'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + process.env.fbAPIKey;
        }
        return this.$axios
          .$post(authUrl, {
              email: authData.email,
              password: authData.password,
              returnSecureToken: true
            }
          ).then(result => {
            vuexContext.commit('setToken', result.idToken);
          })
          .catch(e => console.log(e));
      }
    },
    getters: {
      loadedPosts(state) {
        return state.loadedPosts;
      },
      isAuthenticated(state) {
        return state.token != null
      }
    }
  });
};

export default createStore;
