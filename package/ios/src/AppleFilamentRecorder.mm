//
//  AppleFilamentRecorder.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 02.05.24.
//

#include "AppleFilamentRecorder.h"
#include <memory>
#include <mutex>

namespace margelo {

AppleFilamentRecorder::AppleFilamentRecorder(int width, int height, int fps, double bitRate) : FilamentRecorder(width, height, fps, bitRate) {
  Logger::log(TAG, "Creating CVPixelBufferPool...");
  int maxBufferCount = 30;
  NSDictionary* poolAttributes = @{(NSString*)kCVPixelBufferPoolMinimumBufferCountKey : @(maxBufferCount)};
  NSDictionary* pixelBufferAttributes = @{
    (NSString*)kCVPixelBufferWidthKey : @(width),
    (NSString*)kCVPixelBufferHeightKey : @(height),
    (NSString*)kCVPixelBufferPixelFormatTypeKey : @(kCVPixelFormatType_32BGRA),
    (NSString*)kCVPixelBufferMetalCompatibilityKey : @(YES)
  };
  CVReturn result = CVPixelBufferPoolCreate(kCFAllocatorDefault, (__bridge CFDictionaryRef)poolAttributes,
                                            (__bridge CFDictionaryRef)pixelBufferAttributes, &_pixelBufferPool);
  if (result != kCVReturnSuccess) {
    throw std::runtime_error("Failed to create " + std::to_string(width) + "x" + std::to_string(height) +
                             " CVPixelBufferPool! Status: " + std::to_string(result));
  }

  Logger::log(TAG, "Creating CVPixelBuffer target texture...");
  result = CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, _pixelBufferPool, &_pixelBuffer);
  if (result != kCVReturnSuccess) {
    throw std::runtime_error("Failed to create " + std::to_string(width) + "x" + std::to_string(height) +
                             " CVPixelBuffer texture! Status: " + std::to_string(result));
  }

  Logger::log(TAG, "Creating temporary file...");
  NSString* tempDirectory = NSTemporaryDirectory();
  NSString* filename = [NSString stringWithFormat:@"%@.mp4", [[NSUUID UUID] UUIDString]];
  NSString* filePath = [tempDirectory stringByAppendingPathComponent:filename];
  _path = [NSURL fileURLWithPath:filePath];
  Logger::log(TAG, "Recording to " + std::string(filePath.UTF8String) + "...");

  Logger::log(TAG, "Creating AVAssetWriter...");
  NSError* error;
  _assetWriter = [AVAssetWriter assetWriterWithURL:_path fileType:AVFileTypeMPEG4 error:&error];
  if (error != nil) {
    std::string path = _path.absoluteString.UTF8String;
    std::string domain = error.domain.UTF8String;
    std::string code = std::to_string(error.code);
    throw std::runtime_error("Failed to create AVAssetWriter at " + path + ", error: " + domain + " (Code: " + code + ")");
  }
  _assetWriter.shouldOptimizeForNetworkUse = NO;

  Logger::log(TAG, "Creating AVAssetWriterInput...");
  NSDictionary* outputSettings = @{
    AVVideoCodecKey : AVVideoCodecTypeH264,
    AVVideoCompressionPropertiesKey : @{
      AVVideoExpectedSourceFrameRateKey : @(fps),
      AVVideoMaxKeyFrameIntervalKey : @(fps),
      AVVideoAverageBitRateKey : @(bitRate),
      AVVideoProfileLevelKey : AVVideoProfileLevelH264HighAutoLevel
    },
    AVVideoWidthKey : @(width),
    AVVideoHeightKey : @(height)
  };
  _assetWriterInput = [AVAssetWriterInput assetWriterInputWithMediaType:AVMediaTypeVideo outputSettings:outputSettings];
  if (![_assetWriter canAddInput:_assetWriterInput]) {
    std::string settingsJson = outputSettings.description.UTF8String;
    throw std::runtime_error("Failed to add AVAssetWriterInput to AVAssetWriter! Settings used: " + settingsJson);
  }
  // TODO: Set _assetWriterInput.expectsMediaDataInRealTime to YES or NO?
  // TODO: Set _assetWriterInput.performsMultiPassEncodingIfSupported to YES or NO?
  _pixelBufferAdaptor = [AVAssetWriterInputPixelBufferAdaptor assetWriterInputPixelBufferAdaptorWithAssetWriterInput:_assetWriterInput
                                                                                         sourcePixelBufferAttributes:nil];

  Logger::log(TAG, "Adding AVAssetWriterInput...");
  [_assetWriter addInput:_assetWriterInput];
}

void AppleFilamentRecorder::renderFrame(double timestamp) {
  CVPixelBufferRef targetBuffer;
  CVReturn result = CVPixelBufferPoolCreatePixelBuffer(kCFAllocatorDefault, _pixelBufferPool, &targetBuffer);
  if (result != kCVReturnSuccess) {
    throw std::runtime_error("Failed to create CVPixelBuffer for writing! Status: " + std::to_string(result));
  }

  CVPixelBufferLockBaseAddress(targetBuffer, /* write flag */ 0);
  CVPixelBufferLockBaseAddress(_pixelBuffer, kCVPixelBufferLock_ReadOnly);

  size_t bytesPerRow = CVPixelBufferGetBytesPerRow(_pixelBuffer);
  size_t height = CVPixelBufferGetHeight(_pixelBuffer);

  void* destination = CVPixelBufferGetBaseAddress(targetBuffer);
  void* source = CVPixelBufferGetBaseAddress(_pixelBuffer);

  memcpy(destination, source, bytesPerRow * height);

  CVPixelBufferUnlockBaseAddress(targetBuffer, /* write flag */ 0);
  CVPixelBufferUnlockBaseAddress(_pixelBuffer, kCVPixelBufferLock_ReadOnly);

  CMTime time = CMTimeMake(timestamp, 1);
  [_pixelBufferAdaptor appendPixelBuffer:targetBuffer withPresentationTime:time];
    Logger::log(TAG, "Appending pixel buffer to AVAssetWriterInput...");
}

void* AppleFilamentRecorder::getNativeWindow() {
  return static_cast<void*>(_pixelBuffer);
}

std::future<void> AppleFilamentRecorder::startRecording() {
  Logger::log(TAG, "Starting recording...");
  auto self = shared<AppleFilamentRecorder>();
  return std::async(std::launch::async, [self]() {
    [self->_assetWriter startWriting];
    [self->_assetWriter startSessionAtSourceTime:kCMTimeZero];
    Logger::log(TAG, "Recording started!");
  });
}

std::future<std::string> AppleFilamentRecorder::stopRecording() {
  Logger::log(TAG, "Stopping recording...");
  auto promise = std::make_shared<std::promise<std::string>>();
  auto self = shared<AppleFilamentRecorder>();
  dispatch_async(_queue, ^{
    // Stop the AVAssetWriter
    [self->_assetWriterInput markAsFinished];
    // Finish and wait for callback
    [self->_assetWriter finishWritingWithCompletionHandler:^{
      Logger::log(TAG, "Recording finished!");
      AVAssetWriterStatus status = self->_assetWriter.status;
      if (status != AVAssetWriterStatusCompleted) {
        Logger::log(TAG, "Recording finished with error; %zu", static_cast<int>(status));
        auto error = std::runtime_error("AVAssetWriter didn't finish properly, status: " + std::to_string(static_cast<int>(status)));
        auto exceptionPtr = std::make_exception_ptr(error);
        promise->set_exception(exceptionPtr);
        return;
      }

      Logger::log(TAG, "Recording finished successfully!");
      NSString* path = self->_path.absoluteString;
      std::string stringPath = path.UTF8String;
      promise->set_value(stringPath);
    }];

    CVPixelBufferPoolFlush(self->_pixelBufferPool, 0);
  });

  return promise->get_future();
}

} // namespace margelo
