//
// Created by Marc Rousavy on 05.03.24.
//

#include "RNFLogger.h"
#include <android/log.h>
#include <string>

namespace margelo {

void Logger::log(const std::string& tag, const std::string& message) {
#if RNF_ENABLE_LOGS
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wformat-security"
  __android_log_print(ANDROID_LOG_INFO, ("RNF/" + tag).c_str(), message.c_str());
#pragma clang diagnostic pop
#endif
}

} // namespace margelo