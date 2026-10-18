import CoreMedia

extension CMTime {
  /** The time of frame `frameIndex` at `fps`, exact for rates with up to three decimals. */
  init(frameIndex: Double, fps: Double) {
    self.init(value: CMTimeValue(frameIndex * 1000), timescale: CMTimeScale((fps * 1000).rounded()))
  }
}
