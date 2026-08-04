#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct ConversionError: Error, CustomStringConvertible {
  let description: String
}

guard CommandLine.arguments.count == 3 else {
  fputs("用法: media_first_frame_to_png.swift <输入图片或 GIF> <输出 PNG>\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let outputSize = 360

do {
  guard let source = CGImageSourceCreateWithURL(inputURL as CFURL, nil),
        let firstFrame = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
    throw ConversionError(description: "无法读取素材: \(inputURL.path)")
  }
  guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
        let context = CGContext(
          data: nil,
          width: outputSize,
          height: outputSize,
          bitsPerComponent: 8,
          bytesPerRow: 0,
          space: colorSpace,
          bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
        ) else {
    throw ConversionError(description: "无法创建静态图画布")
  }

  let scale = min(
    Double(outputSize) / Double(firstFrame.width),
    Double(outputSize) / Double(firstFrame.height)
  )
  let width = Double(firstFrame.width) * scale
  let height = Double(firstFrame.height) * scale
  let frame = CGRect(
    x: (Double(outputSize) - width) / 2,
    y: (Double(outputSize) - height) / 2,
    width: width,
    height: height
  )

  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(CGRect(x: 0, y: 0, width: outputSize, height: outputSize))
  context.interpolationQuality = .high
  context.draw(firstFrame, in: frame)

  guard let output = context.makeImage(),
        let destination = CGImageDestinationCreateWithURL(
          outputURL as CFURL,
          UTType.png.identifier as CFString,
          1,
          nil
        ) else {
    throw ConversionError(description: "无法创建 PNG: \(outputURL.path)")
  }
  CGImageDestinationAddImage(destination, output, nil)
  guard CGImageDestinationFinalize(destination) else {
    throw ConversionError(description: "PNG 写入失败: \(outputURL.path)")
  }
  print("已输出 \(outputURL.lastPathComponent): 360x360 静态图")
} catch {
  fputs("错误: \(error)\n", stderr)
  exit(1)
}
