export interface AssetUri {
  /**
   * `file://` path, `http(s)://` URL, or the name of an asset bundled with the app (what
   * `Image.resolveAssetSource(require(...)).uri` returns in release builds).
   */
  uri: string
}
