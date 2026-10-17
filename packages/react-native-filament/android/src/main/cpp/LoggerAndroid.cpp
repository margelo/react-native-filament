#include "utils/Logger.hpp"

#include <android/log.h>

namespace margelo::nitro::filament {

void logError(const std::string& message) {
  __android_log_write(ANDROID_LOG_ERROR, "react-native-filament", message.c_str());
}

} // namespace margelo::nitro::filament
