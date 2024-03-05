//
//  AppleLogger.cpp
//  react-native-filament
//
//  Created by Marc Rousavy on 05.03.24.
//

#include "Logger.h"
#include <Foundation/Foundation.h>

namespace margelo {

void Logger::log(const std::string& message) {
  NSString* string = [NSString stringWithUTF8String:message.c_str()];
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wformat-security"
  NSLog(string);
#pragma clang diagnostic pop
}

} // namespace margelo
