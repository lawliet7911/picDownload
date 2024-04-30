import puppeteer from 'puppeteer'
import cheerio from 'cheerio'
import urlModule from 'url'
import { downloadImage } from './index.mjs'
import { DOWNLOAD_DIR } from '../config.mjs'

// 爬取网页并下载图片的函数
export const scrapeAndDownloadImages = async (startUrl) => {
  // headless: true 不打开浏览器窗口
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // 导航到页面
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 0 })

    // 获取页面HTML
    const html = await page.content()

    // 使用Cheerio解析HTML
    const $ = cheerio.load(html)
    const images = $('img')

    // 过滤并下载非GIF图片
    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      const src = $(img).attr('src')

      // 检查图片格式是否为GIF
      if (!src.endsWith('.gif')) {
        // 构造完整的图片URL
        const fullImageUrl = urlModule.resolve(startUrl, src)

        // 从URL中提取图片名称
        const filename = urlModule.parse(fullImageUrl).pathname.split('/').pop()

        // 定义图片保存路径
        const destPath = `${DOWNLOAD_DIR}/${filename}`

        // 下载图片
        try {
          await downloadImage(fullImageUrl, destPath)
          console.log(`图片已下载：${destPath}`)
        } catch (error) {
          console.error(`下载图片失败：${error}`)
        }
      }
    }
  } catch (error) {
    console.error(`爬取页面失败：${error}`)
  } finally {
    // 关闭浏览器
    await browser.close()
  }
}
