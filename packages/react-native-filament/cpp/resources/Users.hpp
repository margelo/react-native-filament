#pragma once

#include <memory>
#include <vector>

namespace margelo::nitro::filament {

template <typename T> class Users final {
public:
  void add(const std::shared_ptr<T>& user) {
    remove(user);
    users_.push_back(user);
  }

  void remove(const std::shared_ptr<T>& user) {
    std::erase_if(users_, [&](const std::weak_ptr<T>& existing) { return existing.expired() || existing.lock() == user; });
  }

  template <typename F> void forEach(F&& function) {
    std::vector<std::weak_ptr<T>> snapshot = users_;
    for (const std::weak_ptr<T>& user : snapshot) {
      if (std::shared_ptr<T> strong = user.lock()) {
        function(strong);
      }
    }
  }

private:
  std::vector<std::weak_ptr<T>> users_;
};

} // namespace margelo::nitro::filament
