//
//  AppleChoreographer.h
//  Pods
//
//  Created by Marc Rousavy on 23.02.24.
//

#pragma once

#include "RNFChoreographer.h"
#include "RNFDisplayLinkListener.h"

namespace margelo {

class AppleChoreographer : public Choreographer, public std::enable_shared_from_this<AppleChoreographer> {
public:
  explicit AppleChoreographer();
  ~AppleChoreographer();

  void stop() override;
  void start() override;

private:
  DisplayLinkListener* _displayLink;
};

} // namespace margelo
