//
// Created by Marc Rousavy on 22.02.24.
//

#pragma once

#include "TestEnum.h"
#include "jsi/HybridObject.h"
#include <optional>
#include <string>
#include <vector>

namespace margelo {

class TestHybridObject : public HybridObject {
public:
  explicit TestHybridObject() : HybridObject("TestHybridObject") {}

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
  void setString(const std::string& newValue) {
    _string = newValue;
  }
  void setEnum(TestEnum testEnum) {
    _enum = testEnum;
  }
  TestEnum getEnum() {
    return _enum;
  }
  std::optional<std::string> getNullableString() {
    return _nullableString;
  }
  void setNullableString(std::optional<std::string> string) {
    _nullableString = string;
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

  uint64_t calculateFibonacci(int count) {
    uint64_t a = 1, b = 1;
    for (int i = 3; i <= count; i++) {
      int c = a + b;
      a = b;
      b = c;
    }
    return b;
  }

  std::future<uint64_t> calculateFibonacciAsync(int count) {
    return std::async(std::launch::async, [count, this]() { return this->calculateFibonacci(count); });
  }

private:
  int _int;
  std::string _string;
  TestEnum _enum;
  std::optional<std::string> _nullableString;

  void loadHybridMethods() override;
};

} // namespace margelo
