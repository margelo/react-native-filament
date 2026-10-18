import Foundation
import NitroModules

enum AssetLocation: Sendable {
  case file(URL)
  case remote(URL)
  case bundled(URL)

  init(uri: String) throws {
    guard let url = URL(string: uri), let scheme = url.scheme else {
      self = .bundled(try Bundle.main.requireResource(named: uri))
      return
    }
    switch scheme {
    case "file": self = .file(url)
    case "http", "https": self = .remote(url)
    default: throw RuntimeError.error(withMessage: "Unsupported asset URI scheme '\(scheme)' in \(uri).")
    }
  }

  func localFile() async throws -> URL {
    switch self {
    case .file(let url), .bundled(let url): return url
    case .remote(let url): return try await RemoteAssetCache.shared.file(for: url)
    }
  }
}
