//
//  NSThreadDispatcher.m
//  react-native-filament
//
//  Created by Marc Rousavy on 02.04.24.
//

#pragma once

#if __has_include(<NitroModules/Dispatcher.hpp>)
#include <NitroModules/Dispatcher.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif

#include <Foundation/Foundation.h>
#include <string>

namespace margelo {

/**
 A [Dispatcher] implementation that uses an Objective-C NSThread.
 */
class NSThreadDispatcher : public nitro::Dispatcher {
public:
  explicit NSThreadDispatcher(const std::string& name);

public:
  void runSync(std::function<void()>&& function) override;
  void runAsync(std::function<void()>&& function) override;

private:
  __attribute__((hot)) void run(std::function<void()>&& function, bool waitUntilDone);

private:
  NSThread* _thread;
};

} // namespace margelo
