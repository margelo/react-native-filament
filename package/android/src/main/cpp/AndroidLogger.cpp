//
// Created by Marc Rousavy on 05.03.24.
//

#include "Logger.h"
#include <android/log.h>
#include <string>

namespace margelo {

static const auto TAG = "Filament";

void Logger::log(const std::string& message) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wformat-security"
  __android_log_print(ANDROID_LOG_INFO, TAG, message.c_str());
#pragma clang diagnostic pop
}

} // namespace margelo