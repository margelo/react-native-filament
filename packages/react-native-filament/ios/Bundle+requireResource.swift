import Foundation
import NitroModules

extension Bundle {
  func requireResource(named name: String) throws -> URL {
    let file = name as NSString
    guard let url = url(forResource: file.deletingPathExtension, withExtension: file.pathExtension) else {
      throw RuntimeError.error(withMessage: "No asset named \(name) is bundled with the app.")
    }
    return url
  }
}
