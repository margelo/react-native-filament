//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <jsi/jsi.h>

#include <string>
#include <vector>

#include "FilamentView.h"

namespace margelo {

using namespace facebook;

class FilamentProxy : public jsi::HostObject {
private:
  virtual int loadModel(const std::string& path) = 0;
  virtual std::shared_ptr<FilamentView> findFilamentView(int id) = 0;

public:
  std::vector<jsi::PropNameID> getPropertyNames(jsi::Runtime& runtime) override;
  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override;
};

} // namespace margelo
