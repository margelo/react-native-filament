import Foundation
import NitroModules

extension ArrayBuffer {
  static func mapping(contentsOf file: URL) throws -> ArrayBuffer {
    let data = try NSData(contentsOf: file, options: .alwaysMapped)
    guard data.length > 0 else {
      throw RuntimeError.error(withMessage: "\(file.path) is empty.")
    }
    return ArrayBuffer.wrap(dataWithoutCopy: UnsafeMutableRawPointer(mutating: data.bytes), size: data.length) {
      withExtendedLifetime(data) {}
    }
  }
}
