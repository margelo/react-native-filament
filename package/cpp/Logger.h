//
// Created by Marc Rousavy on 05.03.24.
//

#pragma once

#include <iostream>
#include <ostream>
#include <sstream>
#include <string>

namespace margelo {

class Logger {
private:
  Logger() = delete;

private:
  template <typename T> static void processArg(std::ostringstream& oss, const T& value) {
    oss << value;
  }

  template <typename T, typename... Args> static void processArg(std::ostringstream& oss, const T& value, Args&&... args) {
    oss << value;
    processArg(oss, std::forward<Args>(args)...);
  }

public:
  static void log(const std::string& string);

  template <typename... Args> static void log(const std::string& formatString, Args&&... args) {
    std::ostringstream stream;
    stream << formatString;
    processArg(stream, std::forward<Args>(args)...);
    log(stream.str());
  }
};

} // namespace margelo