#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct ConversionError: Error, CustomStringConvertible {
  let description: String
}

struct Point {
  let x: Double
  let y: Double
}

func resizedSquare(_ image: CGImage, size: Int) throws -> CGImage {
  guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
        let context = CGContext(
          data: nil,
          width: size,
          height: size,
          bitsPerComponent: 8,
          bytesPerRow: 0,
          space: colorSpace,
          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
    throw ConversionError(description: "无法创建图像画布")
  }

  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(CGRect(x: 0, y: 0, width: size, height: size))
  context.interpolationQuality = .high
  context.draw(image, in: CGRect(x: 0, y: 0, width: size, height: size))

  guard let output = context.makeImage() else {
    throw ConversionError(description: "无法输出缩放后的图像")
  }
  return output
}

func frameProperties(delay: Double) -> CFDictionary {
  [
    kCGImagePropertyGIFDictionary: [
      kCGImagePropertyGIFDelayTime: delay,
      kCGImagePropertyGIFUnclampedDelayTime: delay,
    ],
  ] as CFDictionary
}

func meanAbsoluteDifference(_ lhs: CGImage, _ rhs: CGImage, sampleSize: Int = 90) throws -> Double {
  let bytesPerPixel = 4
  let bytesPerRow = sampleSize * bytesPerPixel
  let byteCount = bytesPerRow * sampleSize
  var lhsPixels = [UInt8](repeating: 0, count: byteCount)
  var rhsPixels = [UInt8](repeating: 0, count: byteCount)

  guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
    throw ConversionError(description: "无法创建颜色空间")
  }

  func draw(_ image: CGImage, into pixels: inout [UInt8]) throws {
    let created = pixels.withUnsafeMutableBytes { buffer in
      CGContext(
        data: buffer.baseAddress,
        width: sampleSize,
        height: sampleSize,
        bitsPerComponent: 8,
        bytesPerRow: bytesPerRow,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      )
    }
    guard let context = created else {
      throw ConversionError(description: "无法读取关键帧像素")
    }
    context.setFillColor(CGColor(gray: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: sampleSize, height: sampleSize))
    context.interpolationQuality = .medium
    context.draw(image, in: CGRect(x: 0, y: 0, width: sampleSize, height: sampleSize))
  }

  try draw(lhs, into: &lhsPixels)
  try draw(rhs, into: &rhsPixels)

  var total = 0
  for offset in stride(from: 0, to: byteCount, by: bytesPerPixel) {
    total += abs(Int(lhsPixels[offset]) - Int(rhsPixels[offset]))
    total += abs(Int(lhsPixels[offset + 1]) - Int(rhsPixels[offset + 1]))
    total += abs(Int(lhsPixels[offset + 2]) - Int(rhsPixels[offset + 2]))
  }
  return Double(total) / Double(sampleSize * sampleSize * 3)
}

func foregroundCenter(_ image: CGImage, sampleSize: Int = 180) throws -> Point {
  let bytesPerPixel = 4
  let bytesPerRow = sampleSize * bytesPerPixel
  var pixels = [UInt8](repeating: 0, count: bytesPerRow * sampleSize)

  guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else {
    throw ConversionError(description: "无法创建颜色空间")
  }
  let created = pixels.withUnsafeMutableBytes { buffer in
    CGContext(
      data: buffer.baseAddress,
      width: sampleSize,
      height: sampleSize,
      bitsPerComponent: 8,
      bytesPerRow: bytesPerRow,
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )
  }
  guard let context = created else {
    throw ConversionError(description: "无法读取前景像素")
  }
  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(CGRect(x: 0, y: 0, width: sampleSize, height: sampleSize))
  context.interpolationQuality = .medium
  context.draw(image, in: CGRect(x: 0, y: 0, width: sampleSize, height: sampleSize))

  var weightedX = 0.0
  var weightedY = 0.0
  var totalWeight = 0.0
  for y in 0..<sampleSize {
    for x in 0..<sampleSize {
      let offset = y * bytesPerRow + x * bytesPerPixel
      let darkest = min(pixels[offset], pixels[offset + 1], pixels[offset + 2])
      // 忽略白底和极浅的投影，用深色解剖线、肌肉和器械作为稳定锚点。
      let weight = Double(max(0, 242 - Int(darkest)))
      guard weight > 0 else { continue }
      weightedX += Double(x) * weight
      weightedY += Double(y) * weight
      totalWeight += weight
    }
  }

  guard totalWeight > 0 else {
    return Point(x: Double(image.width) / 2, y: Double(image.height) / 2)
  }
  let scale = Double(image.width) / Double(sampleSize)
  return Point(x: weightedX / totalWeight * scale, y: weightedY / totalWeight * scale)
}

func translatedFrame(_ image: CGImage, dx: Double, dy: Double, size: Int) throws -> CGImage {
  guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
        let context = CGContext(
          data: nil,
          width: size,
          height: size,
          bitsPerComponent: 8,
          bytesPerRow: 0,
          space: colorSpace,
          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
    throw ConversionError(description: "无法创建对齐画布")
  }

  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(CGRect(x: 0, y: 0, width: size, height: size))
  context.interpolationQuality = .high
  context.draw(
    image,
    in: CGRect(x: dx, y: dy, width: Double(size), height: Double(size))
  )
  guard let output = context.makeImage() else {
    throw ConversionError(description: "无法输出对齐帧")
  }
  return output
}

func blendedFrame(from start: CGImage, to end: CGImage, progress: Double, size: Int) throws -> CGImage {
  guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
        let context = CGContext(
          data: nil,
          width: size,
          height: size,
          bitsPerComponent: 8,
          bytesPerRow: 0,
          space: colorSpace,
          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
    throw ConversionError(description: "无法创建过渡帧画布")
  }

  let canvas = CGRect(x: 0, y: 0, width: size, height: size)
  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(canvas)
  context.interpolationQuality = .high
  context.setAlpha(1)
  context.draw(start, in: canvas)
  context.setAlpha(progress)
  context.draw(end, in: canvas)

  guard let output = context.makeImage() else {
    throw ConversionError(description: "无法输出过渡帧")
  }
  return output
}

guard CommandLine.arguments.count == 3 else {
  fputs("用法: sprite_sheet_to_gif.swift <2x2-sprite.png> <output.gif>\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])

do {
  guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
        let sprite = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    throw ConversionError(description: "无法读取精灵图: \(inputURL.path)")
  }

  let frameWidth = sprite.width / 2
  let frameHeight = sprite.height / 2
  let cropSize = min(frameWidth, frameHeight)
  var keyframes: [CGImage] = []

  for row in 0..<2 {
    for column in 0..<2 {
      let cellX = column * frameWidth
      let cellY = row * frameHeight
      let cellInset = max(4, cropSize / 50)
      let insetCropSize = cropSize - cellInset * 2
      let cropX = cellX + (frameWidth - cropSize) / 2 + cellInset
      let cropY = cellY + (frameHeight - cropSize) / 2 + cellInset
      let cropRect = CGRect(x: cropX, y: cropY, width: insetCropSize, height: insetCropSize)
      guard let cropped = sprite.cropping(to: cropRect) else {
        throw ConversionError(description: "无法裁切第 \(keyframes.count + 1) 帧")
      }
      keyframes.append(try resizedSquare(cropped, size: 360))
    }
  }

  // AI 图片中的四个姿势会有细小的人物和器械位移。先用前景重心锁定主体坐标，
  // 再比较对齐后的外观差异，避免把整个人的漂移误当作动作。
  var selectedPair = (0, 1)
  var selectedDifference = Double.greatestFiniteMagnitude
  var selectedShift = Point(x: 0, y: 0)
  for first in 0..<keyframes.count {
    for second in (first + 1)..<keyframes.count {
      let firstCenter = try foregroundCenter(keyframes[first])
      let secondCenter = try foregroundCenter(keyframes[second])
      let shift = Point(
        x: max(-48, min(48, firstCenter.x - secondCenter.x)),
        // 像素数组的 Y 轴向下，Core Graphics 画布的 Y 轴向上。
        y: max(-48, min(48, secondCenter.y - firstCenter.y))
      )
      let alignedSecond = try translatedFrame(
        keyframes[second],
        dx: shift.x,
        dy: shift.y,
        size: 360
      )
      let difference = try meanAbsoluteDifference(keyframes[first], alignedSecond)
      if difference < selectedDifference {
        selectedDifference = difference
        selectedPair = (first, second)
        selectedShift = shift
      }
    }
  }

  let firstFrame = keyframes[selectedPair.0]
  let secondFrame = try translatedFrame(
    keyframes[selectedPair.1],
    dx: selectedShift.x,
    dy: selectedShift.y,
    size: 360
  )

  // 一个完整往返约 3.6 秒，端点稍停，避免快速循环晃眼。
  let transitionSteps = 12
  var animationFrames: [(image: CGImage, delay: Double)] = []
  animationFrames.append((firstFrame, 0.40))
  animationFrames.append((firstFrame, 0.20))
  for step in 1..<transitionSteps {
    let progress = Double(step) / Double(transitionSteps)
    animationFrames.append((
      try blendedFrame(
        from: firstFrame,
        to: secondFrame,
        progress: progress,
        size: 360
      ),
      0.11
    ))
  }
  animationFrames.append((secondFrame, 0.40))
  animationFrames.append((secondFrame, 0.20))
  for step in stride(from: transitionSteps - 1, through: 1, by: -1) {
    let progress = Double(step) / Double(transitionSteps)
    animationFrames.append((
      try blendedFrame(
        from: firstFrame,
        to: secondFrame,
        progress: progress,
        size: 360
      ),
      0.11
    ))
  }

  guard let destination = CGImageDestinationCreateWithURL(
    outputURL as CFURL,
    UTType.gif.identifier as CFString,
    animationFrames.count,
    nil
  ) else {
    throw ConversionError(description: "无法创建 GIF: \(outputURL.path)")
  }

  let globalProperties = [
    kCGImagePropertyGIFDictionary: [
      kCGImagePropertyGIFLoopCount: 0,
    ],
  ] as CFDictionary
  CGImageDestinationSetProperties(destination, globalProperties)

  for frame in animationFrames {
    CGImageDestinationAddImage(
      destination,
      frame.image,
      frameProperties(delay: frame.delay)
    )
  }

  guard CGImageDestinationFinalize(destination) else {
    throw ConversionError(description: "GIF 写入失败: \(outputURL.path)")
  }

  let differenceText = String(format: "%.2f", selectedDifference)
  let shiftXText = String(format: "%.1f", selectedShift.x)
  let shiftYText = String(format: "%.1f", selectedShift.y)
  print(
    "已生成 \(outputURL.lastPathComponent): 360x360, \(animationFrames.count) 帧, "
      + "关键帧 \(selectedPair.0 + 1)-\(selectedPair.1 + 1), "
      + "坐标校正 (\(shiftXText), \(shiftYText)), 差异 \(differenceText)"
  )
} catch {
  fputs("错误: \(error)\n", stderr)
  exit(1)
}
