//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "jsi/HybridObject.h"
#include <string>
#include <vector>

namespace margelo {

class TestHybridObject : public HybridObject<TestHybridObject> {
public:
  int getInt() {
    return _int;
  }
  void setInt(int newValue) {
    _int = newValue;
  }
  std::string getString() {
    return _string;
  }
  void setString(std::string newValue) {
    _string = newValue;
  }

  std::unordered_map<std::string, double> multipleArguments(int first, bool second, std::string third) {
    return std::unordered_map<std::string, double>{{"first", 5312}, {"second", 532233}, {"third", 2786}};
  }

  std::function<int()> getIntGetter() {
    return [this]() -> int { return this->_int; };
  }
  void sayHelloCallback(std::function<void(std::string)> callback) {
    callback("Test Hybrid");
  }
  std::shared_ptr<TestHybridObject> createNewHybridObject() {
    return std::make_shared<TestHybridObject>();
  }

private:
  int _int;
  std::string _string;

  void loadHybridMethods() override;
};

} // namespace margelo
