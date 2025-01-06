import type { Post, UID, UserBio, UserInfo } from '@shared'
import { EmptyIDB, IDB } from '@core/utils/storage'

import saveAs from 'file-saver'
import { defineStore, storeToRefs } from 'pinia'
import { useConfigStore } from './configStore'

export const usePostStore = defineStore('post', () => {
  /* 获取到的所有帖子，但会卡内存 */
  // const posts = shallowRef([] as Post[])

  const userInfo = ref<UserInfo | null>(null)

  const configStore = useConfigStore()
  const { config } = storeToRefs(configStore)

  /* 每页的帖子数量 */
  const pageSize = ref(20)

  /* 总帖子数 */
  const total = ref(0)

  const idb = ref<IDB>(new EmptyIDB())

  async function setDB() {
    const wrappedUid = `uid-${config.value.uid}` as UID
    if (idb.value.name === wrappedUid)
      return
    idb.value = new IDB(wrappedUid)

    await idb.value.clearFollowings()
  }

  /**
   * 等待 IDB 初始化完成
   */
  async function waitIDB() {
    const dbName = `uid-${config.value.uid}`

    while (idb.value.name !== dbName)
      await new Promise(r => setTimeout(r, 300))
  }

  /**
   * 重置 fetch 状态
   */
  async function reset() {
    total.value = 0
    pageSize.value = 20
    configStore.setConfig({
      curPage: 0,
      fetchedCount: 0,
    })

    await setDB()
    await idb.value.clearDB()
  }

  /**
   * 添加帖子
   */
  async function add(newPost: Post) {
    await waitIDB()
    await idb.value.addDBPost(newPost)
    config.value.fetchedCount += 1

    config.value.curPage = Math.ceil(config.value.fetchedCount / 20)
  }

  async function getAll() {
    await waitIDB()
    return await idb.value.getAllDBPosts()
  }

  async function setCount() {
    await waitIDB()
    const count = await idb.value.getPostCount()
    configStore.setConfig({ fetchedCount: count })
  }

  async function setUser() {
    if (!userInfo.value)
      return
    await waitIDB()

    const user = toRaw(userInfo.value)
    await idb.value.setUserInfo(user)
  }

  async function addFollowings(followings: UserBio[]) {
    await waitIDB()
    await idb.value.addFollowings(followings)
  }

  async function exportFollowings() {
    await waitIDB()
    const data = await idb.value.getFollowings()
    return await exportData(Date.now(), Date.now(), [], userInfo.value, data)
  }

  /**
   * 导出数据
   */
  async function exportDatas(startTimestamp: number, endTimestamp: number) {
    const posts = await getAll()
    console.log('导出的数量：', posts.length)

    const followings = config.value.weiboOnly
      ? []
      : await idb.value.getFollowings()

    const res = await exportData(startTimestamp, endTimestamp, posts, userInfo.value, followings)
    if (!res)
      return

    // 方法资料：https://stackoverflow.com/questions/77999089/github-rest-api-cors-error-when-trying-to-download-public-repository-git-archive
    const scripts = 'https://corsproxy.io/?url=https://github.com/user-attachments/files/18320820/scripts.zip'
    // saveAs(scripts, `weibo-archiver-scripts-${dateRange}.zip`)
    await downloadScripts(scripts, config.value.name)
  }

  async function downloadScripts(scriptsURL: string, username: string) {
    try {
      // 使用 fetch 获取文件
      const response = await fetch(scriptsURL)
      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      // 获取文件的二进制数据
      const blob = await response.blob()

      // 使用 file-saver 保存文件
      saveAs(blob, `weibo-archiver-scripts-${username}.zip`)
    }
    catch (error) {
      console.error('下载文件失败:', error)
    }
  }

  return {
    total,
    pageSize,
    userInfo,

    setDB,
    add,
    reset,
    getAll,
    setCount,
    setUser,
    exportDatas,
    addFollowings,
    exportFollowings,
  }
})
