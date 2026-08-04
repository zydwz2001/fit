#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO

func pixels(for image: CGImage, size: Int = 90) -> [UInt8]? {
  let bytesPerRow = size * 4
  var output = [UInt8](repeating: 0, count: bytesPerRow * size)
  guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
  let context = output.withUnsafeMutableBytes { buffer in
    CGContext(
      data: buffer.baseAddress,
      width: size,
      height: size,
      bitsPerComponent: 8,
      bytesPerRow: bytesPerRow,
      space: colorSpace,
      bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
    )
  }
  guard let context else { return nil }
  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(CGRect(x: 0, y: 0, width: size, height: size))
  context.draw(image, in: CGRect(x: 0, y: 0, width: size, height: size))
  return output
}

func difference(_ lhs: [UInt8], _ rhs: [UInt8]) -> Double {
  var total = 0
  for offset in stride(from: 0, to: min(lhs.count, rhs.count), by: 4) {
    total += abs(Int(lhs[offset]) - Int(rhs[offset]))
    total += abs(Int(lhs[offset + 1]) - Int(rhs[offset + 1]))
    total += abs(Int(lhs[offset + 2]) - Int(rhs[offset + 2]))
  }
  return Double(total) / Double((min(lhs.count, rhs.count) / 4) * 3)
}

for path in CommandLine.arguments.dropFirst() {
  let url = URL(fileURLWithPath: path)
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else {
    fputs("无法读取: \(path)\n", stderr)
    continue
  }

  var frames: [[UInt8]] = []
  var duration = 0.0
  for index in 0..<CGImageSourceGetCount(source) {
    guard let image = CGImageSourceCreateImageAtIndex(source, index, nil),
          let frame = pixels(for: image) else { continue }
    frames.append(frame)
    if let properties = CGImageSourceCopyPropertiesAtIndex(source, index, nil) as? [CFString: Any],
       let gif = properties[kCGImagePropertyGIFDictionary] as? [CFString: Any] {
      let delay = (gif[kCGImagePropertyGIFUnclampedDelayTime] as? NSNumber)?.doubleValue
        ?? (gif[kCGImagePropertyGIFDelayTime] as? NSNumber)?.doubleValue
        ?? 0
      duration += delay
    }
  }

  let differences = zip(frames, frames.dropFirst()).map(difference)
  let average = differences.isEmpty ? 0 : differences.reduce(0, +) / Double(differences.count)
  let maximum = differences.max() ?? 0
  let averageText = String(format: "%.2f", average)
  let maximumText = String(format: "%.2f", maximum)
  let durationText = String(format: "%.2f", duration)
  print(
    "\(url.lastPathComponent): \(frames.count) 帧, \(durationText) 秒/循环, "
      + "相邻帧平均差异 \(averageText), "
      + "最大差异 \(maximumText)"
  )
}
