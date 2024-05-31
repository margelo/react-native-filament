//
//  AppleFilamentProxy.h
//  react-native-filament
//
//  Created by Marc Rousavy on 20.02.24.
//  Copyright © 2023 mrousavy. All rights reserved.
//

#pragma once

#include "RNFFilamentBuffer.h"
#include "RNFFilamentProxy.h"
#include "RNFFilamentRecorder.h"
#include "RNFFilamentView.h"
#include "threading/RNFDispatcher.h"
#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfacePresenter.h>
#endif

namespace margelo {

class AppleFilamentProxy : public FilamentProxy {
public:
#ifdef RCT_NEW_ARCH_ENABLED
  explicit AppleFilamentProxy(jsi::Runtime* runtime,
                              std::shared_ptr<Dispatcher> jsDispatcher,
                              __weak RCTSurfacePresenter *surfacePresenter);
#else
  explicit AppleFilamentProxy(jsi::Runtime* runtime,
                              std::shared_ptr<Dispatcher> jsDispatcher);
#endif

public:
  std::shared_ptr<FilamentBuffer> loadAsset(const std::string& path) override;
  std::shared_ptr<FilamentView> findFilamentView(int modelId) override;
  std::shared_ptr<Choreographer> createChoreographer() override;
  std::shared_ptr<FilamentRecorder> createRecorder(int width, int height, int fps, double bitRate) override;
  std::shared_ptr<Dispatcher> getJSDispatcher() override;
  std::shared_ptr<Dispatcher> getRenderThreadDispatcher() override;
  std::shared_ptr<Dispatcher> getUIDispatcher() override;
  std::shared_ptr<Dispatcher> getBackgroundDispatcher() override;
  float getDisplayRefreshRate() override;
  float getDensityPixelRatio() override;

  jsi::Runtime& getMainJSRuntime() override;

private:
  // The runtime the proxy has been installed on
  jsi::Runtime* _runtime;
  std::shared_ptr<Dispatcher> _jsDispatcher;
  std::shared_ptr<Dispatcher> _renderThreadDispatcher;
  std::shared_ptr<Dispatcher> _uiDispatcher;
  std::shared_ptr<Dispatcher> _backgroundDispatcher;
#ifdef RCT_NEW_ARCH_ENABLED
  __weak RCTSurfacePresenter *_surfacePresenter;
#endif

private:
  static auto constexpr TAG = "AppleFilamentProxy";
};

} // namespace margelo
