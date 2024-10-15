//
// Created by Marc Rousavy on 20.02.24.
//

#pragma once

#include <functional>
#include <future>
#include <jsi/jsi.h>
#include <string>

#include "RNFListener.h"
#include "RNFListenerManager.h"
#if __has_include(<NitroModules/HybridObject.hpp>)
#include <NitroModules/Dispatcher.hpp>
#include <NitroModules/HybridObject.hpp>
#else
#error NitroModules cannot be found! Are you sure you installed NitroModules properly?
#endif

namespace margelo {

using namespace facebook;

class FilamentRecorder : public nitro::HybridObject {
public:
  using ReadyForMoreDataCallback = std::function<bool()>;

public:
  explicit FilamentRecorder(std::shared_ptr<nitro::Dispatcher> renderThreadDispatcher, int width, int height, int fps, double bitRate);
  ~FilamentRecorder();

public:
  int getWidth() {
    return _width;
  }
  int getHeight() {
    return _height;
  }
  int getFps() {
    return _fps;
  }
  double getBitRate() {
    return _bitRate;
  }

  std::shared_ptr<Listener> addOnReadyForMoreDataListener(const ReadyForMoreDataCallback& callback);
  /**
   * Notify all JS listeners that the Recorder is ready for more data - this will probably cause rendering to happen.
   * This needs to be called from the renderer Thread!
   *
   * Once this returns false, the render loop should be stopped.
   */
  bool onReadyForMoreData();

public:
  virtual bool getIsRecording() = 0;

  virtual std::future<void> startRecording() = 0;
  virtual std::future<std::string> stopRecording() = 0;

  /**
   * Returns the absolute path of the file this Recorder is- or will be recording to.
   */
  virtual std::string getOutputFile() = 0;

  /**
   * Render the current Frame to the video recording, with the given timestamp.
   */
  virtual void renderFrame(double timestamp) = 0;

  /**
   * Get the native window that can be used as a render target.
   * - On iOS, this is a `CVPixelBuffer`
   * - On Android, this is a `ANativeWindow` (`android.media.Surface`)
   * The `FilamentRecorder` has exclusive ownership of the native window.
   */
  virtual void* getNativeWindow() = 0;

protected:
  static constexpr auto TAG = "FilamentRecorder";

protected:
  std::shared_ptr<nitro::Dispatcher> _renderThreadDispatcher;
  int _width;
  int _height;
  int _fps;
  double _bitRate;
  std::shared_ptr<ListenerManager<ReadyForMoreDataCallback>> _listenerManager;

public:
  void loadHybridMethods() override;
};

} // namespace margelo
