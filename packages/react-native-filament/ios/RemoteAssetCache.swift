import CryptoKit
import Foundation
import NitroModules

actor RemoteAssetCache {
  static let shared = RemoteAssetCache()

  private var downloads: [URL: Task<URL, Error>] = [:]

  func file(for url: URL) async throws -> URL {
    if let download = downloads[url] {
      return try await download.value
    }
    let download = Task { try await Self.download(url) }
    downloads[url] = download
    do {
      return try await download.value
    } catch {
      downloads[url] = nil
      throw error
    }
  }

  private static func download(_ url: URL) async throws -> URL {
    let (temporary, response) = try await URLSession.shared.download(from: url)
    defer { try? FileManager.default.removeItem(at: temporary) }
    if let http = response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
      throw RuntimeError.error(withMessage: "Downloading \(url) failed with HTTP \(http.statusCode).")
    }
    let directory = try FileManager.default.url(for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
      .appendingPathComponent("react-native-filament", isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    let target = directory.appendingPathComponent(cacheName(for: url))
    try? FileManager.default.removeItem(at: target)
    try FileManager.default.moveItem(at: temporary, to: target)
    return target
  }

  private static func cacheName(for url: URL) -> String {
    SHA256.hash(data: Data(url.absoluteString.utf8)).map { String(format: "%02x", $0) }.joined()
  }
}
