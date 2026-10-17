import NitroModules

final class HybridAssetIO: HybridAssetIOSpec_base, HybridAssetIOSpec_protocol {
  func read(uri: String) throws -> Promise<ArrayBuffer> {
    return Promise.async {
      let file = try await AssetLocation(uri: uri).localFile()
      return try ArrayBuffer.mapping(contentsOf: file)
    }
  }
}
