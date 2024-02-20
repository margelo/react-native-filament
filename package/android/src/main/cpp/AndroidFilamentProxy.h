//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include "FilamentProxy.h"
#include "java-bindings/JFilamentProxy.h"
#include <fbjni/fbjni.h>
#include <jni.h>

namespace margelo {

using namespace facebook;

/**
 * Implementation for the abstract class FilamentProxy, which uses the JNI Hybrid Class "JFilamentProxy" underneath.
 */
class AndroidFilamentProxy : public FilamentProxy {
public:
  explicit AndroidFilamentProxy(jni::alias_ref<JFilamentProxy> filamentProxy);
  ~AndroidFilamentProxy();

private:
  // TODO(hanno): implement
  int loadModel(const std::string& path);

private:
  jni::global_ref<JFilamentProxy> _proxy;
};

} // namespace margelo
