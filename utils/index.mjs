import https from 'https'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
import { minDimensions, DOWNLOAD_DIR } from '../config.mjs'

export const downloadImage = async (imageUrl, destPath) => {
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

export const cleanDownloadedImages = async () => {
  const files = fs.readdirSync(DOWNLOAD_DIR)

  for (const file of files) {
    const extname = path.extname(file).toLowerCase()

    if (['.php'].includes(extname)) {
      // 如果是.php文件，直接删除
      fs.unlinkSync(path.join(DOWNLOAD_DIR, file))
      continue
    }

    const filePath = path.join(DOWNLOAD_DIR, file)
    const metadata = await sharp(filePath).metadata()

    if (metadata.width < minDimensions.width || metadata.height < minDimensions.height) {
      // 如果图片尺寸小于最小要求，删除图片
      fs.unlinkSync(filePath)
      console.log(`尺寸过小，删除图片：${file}`)
    }
  }
}

export const ensureDirectoryExists = () => {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR)
  }
}
