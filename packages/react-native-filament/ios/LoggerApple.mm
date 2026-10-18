#include "utils/Logger.hpp"

#import <os/log.h>

namespace margelo::nitro::filament {

void logError(const std::string& message) {
  os_log_error(OS_LOG_DEFAULT, "[react-native-filament] %{public}s", message.c_str());
}

} // namespace margelo::nitro::filament
