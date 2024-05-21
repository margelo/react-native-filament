#include "RNFManipulatorWrapper.h"

namespace margelo {
void ManipulatorWrapper::loadHybridMethods() {
  registerHybridMethod("grabBegin", &ManipulatorWrapper::grabBegin, this);
  registerHybridMethod("grabUpdate", &ManipulatorWrapper::grabUpdate, this);
  registerHybridMethod("grabEnd", &ManipulatorWrapper::grabEnd, this);
  registerHybridMethod("scroll", &ManipulatorWrapper::scroll, this);
  registerHybridMethod("update", &ManipulatorWrapper::update, this);
}

void ManipulatorWrapper::grabBegin(float x, float y, bool strafe) {
  pointee()->grabBegin(x, y, strafe);
}

void ManipulatorWrapper::grabUpdate(float x, float y) {
  pointee()->grabUpdate(x, y);
}

void ManipulatorWrapper::grabEnd() {
  pointee()->grabEnd();
}

void ManipulatorWrapper::scroll(float x, float y, float delta) {
  pointee()->scroll(x, y, delta);
}

void ManipulatorWrapper::update(float dt) {
  pointee()->update(dt);
}

} // namespace margelo
