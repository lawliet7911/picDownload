const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const fs = require('fs')
const url = require('url')
const https = require('https')
const sharp = require('sharp')
const path = require('path')

const DOWNLOAD_DIR = 'download'

// 要爬取的网页URL
const startUrl = 'https://www.jkforum.net/p/thread-16563586-1-1.html'

// 用于下载图片的辅助函数
async function downloadImage(imageUrl, destPath) {
  return new Promise((resolve, reject) => {
    https
      .get(imageUrl, (response) => {
        if (response.statusCode === 200) {
          const fileStream = fs.createWriteStream(destPath)
          response.pipe(fileStream)
          fileStream.on('finish', () => {
            fileStream.close(() => resolve(destPath))
          })
        } else {
          reject(`图片下载失败，状态码：${response.statusCode}`)
        }
      })
      .on('error', (err) => {
        reject(`图片下载失败：${err.message}`)
      })
  })
}

// 检查并删除不符合尺寸要求的图片
const cleanDownloadedImages = async () => {
  const files = fs.readdirSync(DOWNLOAD_DIR)
  const minDimensions = { width: 300, height: 500 }

  for (const file of files) {
    if (path.extname(file).toLowerCase() === '.php') {
      // 如果是.php文件，直接删除
      fs.unlinkSync(path.join(DOWNLOAD_DIR, file))
      continue
    }

    const filePath = path.join(DOWNLOAD_DIR, file)
    const metadata = await sharp(filePath).metadata()

    if (metadata.width < minDimensions.width || metadata.height < minDimensions.height) {
      // 如果图片尺寸小于最小要求，删除图片
      fs.unlinkSync(filePath)
      console.log(`尺寸不足，删除图片：${file}`)
    }
  }
}

// 爬取网页并下载图片的函数
async function scrapeAndDownloadImages(startUrl) {
  const browser = await puppeteer.launch({ headless: false })
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
        const fullImageUrl = url.resolve(startUrl, src)

        // 从URL中提取图片名称
        const filename = url.parse(fullImageUrl).pathname.split('/').pop()

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

// 确保下载目录存在
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR)
}

// 开始爬取和下载图片
scrapeAndDownloadImages(startUrl)
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
