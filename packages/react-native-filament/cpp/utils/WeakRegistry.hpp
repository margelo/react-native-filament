#pragma once

#include <memory>
#include <vector>

namespace margelo::nitro::filament {

template <typename T> class WeakRegistry final {
public:
  void add(const std::shared_ptr<T>& item) {
    items_.push_back(item);
  }

  template <typename F> void forEachActive(F&& function) {
    std::erase_if(items_, [&](const std::weak_ptr<T>& weak) {
      std::shared_ptr<T> item = weak.lock();
      if (item == nullptr || item->isStopped()) {
        return true;
      }
      function(*item);
      return false;
    });
  }

  void clear() {
    items_.clear();
  }

private:
  std::vector<std::weak_ptr<T>> items_;
};

} // namespace margelo::nitro::filament
