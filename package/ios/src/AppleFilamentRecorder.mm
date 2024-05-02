//
//  AppleFilamentRecorder.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 02.05.24.
//

#include "AppleFilamentRecorder.h"

namespace margelo {

AppleFilamentRecorder::AppleFilamentRecorder(int width, int height, int fps) : FilamentRecorder(width, height, fps) {
  NSDictionary* pixelAttributes = @{(id)kCVPixelBufferIOSurfacePropertiesKey : @{}};
  CVPixelBufferRef newPixelBuffer = NULL;
  CVReturn result = CVPixelBufferCreate(kCFAllocatorDefault, width, height, kCVPixelFormatType_32BGRA,
                                        (__bridge CFDictionaryRef)(pixelAttributes), &newPixelBuffer);
  if (result != kCVReturnSuccess) {
    throw std::runtime_error("Failed to create " + std::to_string(width) + "x" + std::to_string(height) +
                             " CVPixelBuffer! Status: " + std::to_string(result));
  }

  NSString* tempDirectory = NSTemporaryDirectory();
  NSString* filename = [NSString stringWithFormat:@"%@.mp4", [[NSUUID UUID] UUIDString]];
  NSString* filePath = [tempDirectory stringByAppendingPathComponent:filename];
  _path = [NSURL fileURLWithPath:filePath];
  Logger::log(TAG, "Recording to " + std::string(filePath.UTF8String) + "...");

  NSError* error;
  _assetWriter = [AVAssetWriter assetWriterWithURL:_path fileType:AVFileTypeMPEG4 error:&error];
  if (error != nil) {
    std::string path = _path.absoluteString.UTF8String;
    std::string domain = error.domain.UTF8String;
    std::string code = std::to_string(error.code);
    throw std::runtime_error("Failed to create AVAssetWriter at " + path + ", error: " + domain + " (Code: " + code + ")");
  }
}

void* AppleFilamentRecorder::getNativeWindow() {
  return static_cast<void*>(_pixelBuffer);
}

std::future<void> AppleFilamentRecorder::startRecording() {
  return std::async(std::launch::async, []() { throw std::runtime_error("startRecording() is not yet implemented!"); });
}

std::future<std::string> AppleFilamentRecorder::stopRecording() {
  auto self = shared<AppleFilamentRecorder>();
  return std::async(std::launch::async, [self]() -> std::string { throw std::runtime_error("stopRecording() is not yet implemented!"); });
}

} // namespace margelo
