//
//  AppleLogger.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 05.03.24.
//

#include "Logger.h"
#include <Foundation/Foundation.h>

namespace margelo {

void Logger::log(const std::string& tag, const std::string& message) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wformat-security"
  NSLog(@"[%s]: %s", tag.c_str(), message.c_str());
#pragma clang diagnostic pop
}

} // namespace margelo
