import { cleanDownloadedImages, ensureDirectoryExists } from './utils/index.mjs'
import { scrapeAndDownloadImages } from './utils/scan.mjs'

const targetUrl = 'https://www.jkforum.net/p/thread-16563586-1-1.html'

const main = () => {
  ensureDirectoryExists()

  // 开始爬取和下载图片
  scrapeAndDownloadImages(targetUrl)
    .then(() => {
      console.log('图片下载完成，开始清理工作...')
      return cleanDownloadedImages()
    })
    .then(() => {
      console.log('图片清理完成。')
    })
    .catch((error) => {
      console.error('出现错误。', error)
    })
}

main()
