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

private:
  int _int;
  std::string _string;
  TestEnum _enum;
  std::optional<std::string> _nullableString;

  void loadHybridMethods() override;
};

} // namespace margelo
