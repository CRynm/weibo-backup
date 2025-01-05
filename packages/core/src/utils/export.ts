import type { Post, UserBio, UserInfo } from '@shared'
import { imgsParser } from '@shared'
import fileSaver from 'file-saver'

function formatTimestampToDateShortYear(timestamp: number): string {
  const date = new Date(timestamp)
  const year = String(date.getFullYear()).slice(-2) // 获取年份后两位
  const month = String(date.getMonth() + 1).padStart(2, '0') // 月份补零
  const day = String(date.getDate()).padStart(2, '0') // 日期补零
  return `${year}${month}${day}` // 格式化为 YYMMDD
}

export async function exportData(
  startTimestamp: number,
  endTimestamp: number,
  posts: Post[],
  userInfo?: UserInfo | null,
  followings?: UserBio[],
) {
  if (!userInfo?.name) {
    window.$message.warning('没有数据可以导出')
    return false
  }

  const { name } = userInfo
  const startDate = formatTimestampToDateShortYear(startTimestamp)
  const endDate = formatTimestampToDateShortYear(endTimestamp)
  const dateRange = `${startDate}-${endDate}`

  try {
    const data = {
      weibo: posts,
      user: userInfo || {},
      followings: followings || [],
    }

    const dataStr = JSON.stringify(data)
    const imgsData = Array
      .from(imgsParser(posts))
      .join(',\n') // csv 格式

    window.$message.success('导出成功，正在下载数据...请允许浏览器批量下载文件', {
      duration: 5000,
    })

    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    fileSaver.saveAs(dataBlob, `weibo-data-${name}-${dateRange}.json`)

    if (imgsData.length) {
      const imgsDataBlob = new Blob([imgsData], { type: 'text/csv' })
      fileSaver.saveAs(imgsDataBlob, `imgs-${name}-${dateRange}.csv`)
    }
  }
  catch (err) {
    window.$message.error('导出失败')
    console.error('导出失败', err)
    return false
  }
  return true
}
