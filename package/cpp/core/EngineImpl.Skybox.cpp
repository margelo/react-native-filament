//
// Created by Hanno Gödecke on 30.04.24.
//

#include "EngineImpl.h"
#include "References.h"
#include "utils/Converter.h"

namespace margelo {
void EngineImpl::setSkyboxColorRGBA(std::string hexColor) {
  math::float4 sRGBColorA = Converter::hexColorToSRGBLinear(hexColor);

  Skybox::Builder builder = Skybox::Builder().color(sRGBColorA);
  _skybox = References<Skybox>::adoptEngineRef(_engine, builder.build(*_engine),
                                               [](std::shared_ptr<Engine> engine, Skybox* skybox) { engine->destroy(skybox); });
}
} // namespace margelo
