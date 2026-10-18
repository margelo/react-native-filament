#pragma once

#include <atomic>
#include <cstdint>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

namespace margelo::nitro::filament {

class Resource : public std::enable_shared_from_this<Resource> {
public:
  virtual ~Resource() = default;

  bool isLive() const;
  bool isDestroyed() const;
  void requireLive(const char* method) const;
  bool markDisposing();
  void destroyTree();
  void adopt(const std::shared_ptr<Resource>& child);
  void countLiveDescendants(std::unordered_map<std::string, double>& counts);

protected:
  explicit Resource(const char* kind) : kind_(kind) {}
  virtual void destroyNative() = 0;

private:
  enum class State : uint8_t { Live, Disposing, Destroyed };

  std::vector<std::shared_ptr<Resource>> liveChildren();

  const char* kind_;
  std::atomic<State> state_{State::Live};
  std::mutex childrenMutex_;
  std::vector<std::weak_ptr<Resource>> children_;
};

} // namespace margelo::nitro::filament
