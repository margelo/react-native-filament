#include "SupportedBackends.hpp"

#ifdef __ANDROID__
#include <dlfcn.h>
#include <vulkan/vulkan.h>
#endif

namespace margelo::nitro::filament {

#ifdef __ANDROID__
static bool isVulkan11Available() {
  void* loader = dlopen("libvulkan.so", RTLD_NOW | RTLD_LOCAL);
  if (loader == nullptr) {
    return false;
  }
  auto enumerateInstanceVersion = reinterpret_cast<PFN_vkEnumerateInstanceVersion>(dlsym(loader, "vkEnumerateInstanceVersion"));
  uint32_t version = VK_API_VERSION_1_0;
  bool available = enumerateInstanceVersion != nullptr && enumerateInstanceVersion(&version) == VK_SUCCESS && version >= VK_API_VERSION_1_1;
  dlclose(loader);
  return available;
}
#endif

std::vector<EngineBackend> supportedBackends() {
#ifdef __APPLE__
  return {EngineBackend::METAL};
#else
  if (isVulkan11Available()) {
    return {EngineBackend::VULKAN, EngineBackend::OPENGL};
  }
  return {EngineBackend::OPENGL};
#endif
}

} // namespace margelo::nitro::filament
