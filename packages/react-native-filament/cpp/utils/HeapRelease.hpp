#pragma once

#ifdef __ANDROID__
#include <dlfcn.h>
#include <malloc.h>
#endif

namespace margelo::nitro::filament {

/** Returns free heap pages to the system: Android's allocator otherwise keeps them until the process allocates again. */
inline void releaseFreeHeapPages() {
#ifdef __ANDROID__
  // mallopt() is only declared from API level 26, so it is looked up for older minimum SDKs.
  static auto setMallocOption = reinterpret_cast<int (*)(int, int)>(dlsym(RTLD_DEFAULT, "mallopt"));
  if (setMallocOption != nullptr && setMallocOption(M_PURGE_ALL, 0) == 0) {
    setMallocOption(M_PURGE, 0);
  }
#endif
}

} // namespace margelo::nitro::filament
