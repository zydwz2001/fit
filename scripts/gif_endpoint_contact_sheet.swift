#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
  fputs("用法: gif_endpoint_contact_sheet.swift <GIF 目录> <输出 PNG>\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let files = (try FileManager.default.contentsOfDirectory(
  at: inputURL,
  includingPropertiesForKeys: nil
))
  .filter { $0.pathExtension.lowercased() == "gif" }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }

let columns = 3
let cellWidth = 300
let cellHeight = 150
let rows = Int(ceil(Double(files.count) / Double(columns)))
guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
      let context = CGContext(
        data: nil,
        width: columns * cellWidth,
        height: rows * cellHeight,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      ) else {
  fputs("无法创建联系表画布\n", stderr)
  exit(1)
}

context.setFillColor(CGColor(gray: 0.94, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: columns * cellWidth, height: rows * cellHeight))
context.interpolationQuality = .high

for (index, file) in files.enumerated() {
  guard let source = CGImageSourceCreateWithURL(file as CFURL, nil) else { continue }
  let count = CGImageSourceGetCount(source)
  guard count > 0,
        let first = CGImageSourceCreateImageAtIndex(source, 0, nil),
        let midpoint = CGImageSourceCreateImageAtIndex(source, count / 2, nil) else { continue }
  let column = index % columns
  let row = rows - 1 - index / columns
  let originX = column * cellWidth
  let originY = row * cellHeight
  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(CGRect(x: originX + 4, y: originY + 4, width: 292, height: 142))
  context.draw(first, in: CGRect(x: originX + 7, y: originY + 7, width: 136, height: 136))
  context.draw(midpoint, in: CGRect(x: originX + 157, y: originY + 7, width: 136, height: 136))
}

guard let sheet = context.makeImage(),
      let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
      ) else {
  fputs("无法输出联系表\n", stderr)
  exit(1)
}
CGImageDestinationAddImage(destination, sheet, nil)
guard CGImageDestinationFinalize(destination) else {
  fputs("联系表写入失败\n", stderr)
  exit(1)
}
print("已输出 \(files.count) 个 GIF 的起止姿势对照表: \(outputURL.path)")
