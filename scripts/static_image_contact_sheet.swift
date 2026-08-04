#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 3 else {
  fputs("用法: static_image_contact_sheet.swift <PNG 目录> <输出 PNG>\n", stderr)
  exit(2)
}

let inputURL = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2])
let files = (try FileManager.default.contentsOfDirectory(
  at: inputURL,
  includingPropertiesForKeys: nil
))
  .filter { $0.pathExtension.lowercased() == "png" }
  .sorted { $0.lastPathComponent < $1.lastPathComponent }

let columns = 5
let cellSize = 150
let rows = Int(ceil(Double(files.count) / Double(columns)))
guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB),
      let context = CGContext(
        data: nil,
        width: columns * cellSize,
        height: rows * cellSize,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: colorSpace,
        bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
      ) else {
  fputs("无法创建静态图联系表\n", stderr)
  exit(1)
}

context.setFillColor(CGColor(gray: 0.94, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: columns * cellSize, height: rows * cellSize))
context.interpolationQuality = .high

for (index, file) in files.enumerated() {
  guard let source = CGImageSourceCreateWithURL(file as CFURL, nil),
        let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else { continue }
  let column = index % columns
  let row = rows - 1 - index / columns
  let originX = column * cellSize
  let originY = row * cellSize
  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(CGRect(x: originX + 4, y: originY + 4, width: 142, height: 142))
  context.draw(image, in: CGRect(x: originX + 7, y: originY + 7, width: 136, height: 136))
}

guard let sheet = context.makeImage(),
      let destination = CGImageDestinationCreateWithURL(
        outputURL as CFURL,
        UTType.png.identifier as CFString,
        1,
        nil
      ) else {
  fputs("无法输出静态图联系表\n", stderr)
  exit(1)
}
CGImageDestinationAddImage(destination, sheet, nil)
guard CGImageDestinationFinalize(destination) else {
  fputs("静态图联系表写入失败\n", stderr)
  exit(1)
}
print("已输出 \(files.count) 张静态图联系表: \(outputURL.path)")
