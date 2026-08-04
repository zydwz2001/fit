#!/usr/bin/env swift

import CoreGraphics
import Foundation
import ImageIO

struct Point {
  let x: Double
  let y: Double
}

func foregroundCenter(_ image: CGImage, sampleSize: Int = 180) -> Point? {
  let bytesPerRow = sampleSize * 4
  var pixels = [UInt8](repeating: 0, count: bytesPerRow * sampleSize)
  guard let colorSpace = CGColorSpace(name: CGColorSpace.sRGB) else { return nil }
  let context = pixels.withUnsafeMutableBytes { buffer in
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
  guard let context else { return nil }
  context.setFillColor(CGColor(gray: 1, alpha: 1))
  context.fill(CGRect(x: 0, y: 0, width: sampleSize, height: sampleSize))
  context.draw(image, in: CGRect(x: 0, y: 0, width: sampleSize, height: sampleSize))

  var weightedX = 0.0
  var weightedY = 0.0
  var totalWeight = 0.0
  for y in 0..<sampleSize {
    for x in 0..<sampleSize {
      let offset = y * bytesPerRow + x * 4
      let darkest = min(pixels[offset], pixels[offset + 1], pixels[offset + 2])
      let weight = Double(max(0, 242 - Int(darkest)))
      guard weight > 0 else { continue }
      weightedX += Double(x) * weight
      weightedY += Double(y) * weight
      totalWeight += weight
    }
  }
  guard totalWeight > 0 else { return nil }
  let scale = Double(image.width) / Double(sampleSize)
  return Point(x: weightedX / totalWeight * scale, y: weightedY / totalWeight * scale)
}

for path in CommandLine.arguments.dropFirst() {
  let url = URL(fileURLWithPath: path)
  guard let source = CGImageSourceCreateWithURL(url as CFURL, nil) else { continue }
  var centers: [Point] = []
  for index in 0..<CGImageSourceGetCount(source) {
    guard let image = CGImageSourceCreateImageAtIndex(source, index, nil),
          let center = foregroundCenter(image) else { continue }
    centers.append(center)
  }
  guard let first = centers.first else { continue }
  let maximumDrift = centers.map { hypot($0.x - first.x, $0.y - first.y) }.max() ?? 0
  let xRange = (centers.map(\.x).min() ?? 0)...(centers.map(\.x).max() ?? 0)
  let yRange = (centers.map(\.y).min() ?? 0)...(centers.map(\.y).max() ?? 0)
  let driftText = String(format: "%.2f", maximumDrift)
  let xText = String(format: "%.2f", xRange.upperBound - xRange.lowerBound)
  let yText = String(format: "%.2f", yRange.upperBound - yRange.lowerBound)
  print("\(url.lastPathComponent): 重心漂移 \(driftText) px, X 范围 \(xText), Y 范围 \(yText)")
}
