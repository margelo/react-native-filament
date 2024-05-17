#include "ViewWrapper.h"

namespace margelo {

void ViewWrapper::loadHybridMethods() {
  registerHybridMethod("getAspectRatio", &ViewWrapper::getAspectRatio, this);
  registerHybridMethod("createAmbientOcclusionOptions", &ViewWrapper::createAmbientOcclusionOptions, this);
  registerHybridMethod("setAmbientOcclusionOptions", &ViewWrapper::setAmbientOcclusionOptions, this);
  registerHybridMethod("getAmbientOcclusionOptions", &ViewWrapper::getAmbientOcclusionOptions, this);
  registerHybridMethod("createDynamicResolutionOptions", &ViewWrapper::createDynamicResolutionOptions, this);
  registerHybridMethod("setDynamicResolutionOptions", &ViewWrapper::setDynamicResolutionOptions, this);
  registerHybridMethod("getDynamicResolutionOptions", &ViewWrapper::getDynamicResolutionOptions, this);
  registerHybridSetter("temporalAntiAliasingOptions", &ViewWrapper::setTemporalAntiAliasingOptions, this);
  registerHybridGetter("screenSpaceRefraction", &ViewWrapper::isScreenSpaceRefractionEnabled, this);
  registerHybridSetter("screenSpaceRefraction", &ViewWrapper::setScreenSpaceRefractionEnabled, this);
  registerHybridGetter("postProcessing", &ViewWrapper::isPostProcessingEnabled, this);
  registerHybridSetter("postProcessing", &ViewWrapper::setPostProcessingEnabled, this);
  registerHybridGetter("shadowing", &ViewWrapper::isShadowingEnabled, this);
  registerHybridSetter("shadowing", &ViewWrapper::setShadowingEnabled, this);
  registerHybridGetter("dithering", &ViewWrapper::getDithering, this);
  registerHybridSetter("dithering", &ViewWrapper::setDithering, this);
  registerHybridGetter("antiAliasing", &ViewWrapper::getAntiAliasing, this);
  registerHybridSetter("antiAliasing", &ViewWrapper::setAntiAliasing, this);
  registerHybridMethod("projectWorldToScreen", &ViewWrapper::projectWorldToScreen, this);
  registerHybridMethod("pickEntity", &ViewWrapper::pickEntity, this);
}

double ViewWrapper::getAspectRatio() {
  uint32_t height = pointee()->getViewport().height;
  if (height == 0) {
    return 0;
  }
  uint32_t width = pointee()->getViewport().width;
  if (width == 0) {
    return 0;
  }

  return (double)width / height;
}

void ViewWrapper::setAmbientOcclusionOptions(std::shared_ptr<AmbientOcclusionOptionsWrapper> options) {
  if (!options) {
    [[unlikely]];
    throw std::invalid_argument("AmbientOcclusionOptions is null");
  }
  std::unique_lock lock(_mutex);
  pointee()->setAmbientOcclusionOptions(*options.get());
}

std::shared_ptr<AmbientOcclusionOptionsWrapper> ViewWrapper::getAmbientOcclusionOptions() {
  return std::make_shared<AmbientOcclusionOptionsWrapper>(pointee()->getAmbientOcclusionOptions());
}

std::shared_ptr<AmbientOcclusionOptionsWrapper> ViewWrapper::createAmbientOcclusionOptions() {
  return std::make_shared<AmbientOcclusionOptionsWrapper>();
}

std::shared_ptr<DynamicResolutionOptionsWrapper> ViewWrapper::createDynamicResolutionOptions() {
  return std::make_shared<DynamicResolutionOptionsWrapper>();
}

void ViewWrapper::setDynamicResolutionOptions(std::shared_ptr<DynamicResolutionOptionsWrapper> options) {
  if (!options) {
    [[unlikely]];
    throw std::invalid_argument("DynamicResolutionOptions is null");
  }
  std::unique_lock lock(_mutex);
  pointee()->setDynamicResolutionOptions(*options.get());
}

std::shared_ptr<DynamicResolutionOptionsWrapper> ViewWrapper::getDynamicResolutionOptions() {
  return std::make_shared<DynamicResolutionOptionsWrapper>(pointee()->getDynamicResolutionOptions());
}

void ViewWrapper::setTemporalAntiAliasingOptions(std::unordered_map<std::string, double> options) {
  TemporalAntiAliasingOptions temporalAntiAliasingOptions;
  if (options.find("enabled") != options.end()) {
    temporalAntiAliasingOptions.enabled = options["enabled"] == 1.0;
  }
  if (options.find("upscaling") != options.end()) {
    temporalAntiAliasingOptions.upscaling = options["upscaling"] == 1.0;
  }
  if (options.find("filterInput") != options.end()) {
    temporalAntiAliasingOptions.filterInput = options["filterInput"] == 1.0;
  }
  if (options.find("filterHistory") != options.end()) {
    temporalAntiAliasingOptions.filterHistory = options["filterHistory"] == 1.0;
  }
  if (options.find("useYCoCg") != options.end()) {
    temporalAntiAliasingOptions.useYCoCg = options["useYCoCg"] == 1.0;
  }
  if (options.find("boxClipping") != options.end()) {
    if (options["boxClipping"] == 0.0) {
      temporalAntiAliasingOptions.boxClipping = TemporalAntiAliasingOptions::BoxClipping::ACCURATE;
    } else if (options["boxClipping"] == 1.0) {
      temporalAntiAliasingOptions.boxClipping = TemporalAntiAliasingOptions::BoxClipping::CLAMP;
    } else if (options["boxClipping"] == 2.0) {
      temporalAntiAliasingOptions.boxClipping = TemporalAntiAliasingOptions::BoxClipping::NONE;
    } else {
      [[unlikely]];
      throw std::invalid_argument("Invalid boxClipping value");
    }
  }
  if (options.find("jitterPattern") != options.end()) {
    if (options["jitterPattern"] == 0.0) {
      temporalAntiAliasingOptions.jitterPattern = TemporalAntiAliasingOptions::JitterPattern::RGSS_X4;
    } else if (options["jitterPattern"] == 1.0) {
      temporalAntiAliasingOptions.jitterPattern = TemporalAntiAliasingOptions::JitterPattern::UNIFORM_HELIX_X4;
    } else if (options["jitterPattern"] == 2.0) {
      temporalAntiAliasingOptions.jitterPattern = TemporalAntiAliasingOptions::JitterPattern::HALTON_23_X8;
    } else if (options["jitterPattern"] == 3.0) {
      temporalAntiAliasingOptions.jitterPattern = TemporalAntiAliasingOptions::JitterPattern::HALTON_23_X16;
    } else if (options["jitterPattern"] == 4.0) {
      temporalAntiAliasingOptions.jitterPattern = TemporalAntiAliasingOptions::JitterPattern::HALTON_23_X32;
    } else {
      [[unlikely]];
      throw std::invalid_argument("Invalid boxClipping value");
    }
  }
  if (options.find("feedback") != options.end()) {
    temporalAntiAliasingOptions.feedback = options["feedback"];
  }
  if (options.find("lodBias") != options.end()) {
    temporalAntiAliasingOptions.lodBias = options["lodBias"];
  }
  if (options.find("sharpness") != options.end()) {
    temporalAntiAliasingOptions.sharpness = options["sharpness"];
  }
  if (options.find("upscaling") != options.end()) {
    temporalAntiAliasingOptions.upscaling = options["upscaling"];
  }
  if (options.find("preventFlickering") != options.end()) {
    temporalAntiAliasingOptions.preventFlickering = options["preventFlickering"] == 1.0;
  }
  if (options.find("varianceGamma") != options.end()) {
    temporalAntiAliasingOptions.varianceGamma = options["varianceGamma"] == 1.0;
  }
  if (options.find("historyReprojection") != options.end()) {
    temporalAntiAliasingOptions.historyReprojection = options["historyReprojection"] == 1.0;
  }
  pointee()->setTemporalAntiAliasingOptions(temporalAntiAliasingOptions);
}

void ViewWrapper::setPostProcessingEnabled(bool enabled) {
  pointee()->setPostProcessingEnabled(enabled);
}

bool ViewWrapper::isPostProcessingEnabled() {
  return pointee()->isPostProcessingEnabled();
}

void ViewWrapper::setScreenSpaceRefractionEnabled(bool enabled) {
  pointee()->setScreenSpaceRefractionEnabled(enabled);
}

bool ViewWrapper::isScreenSpaceRefractionEnabled() {
  return pointee()->isScreenSpaceRefractionEnabled();
}

bool ViewWrapper::isShadowingEnabled() {
  return pointee()->isShadowingEnabled();
}

void ViewWrapper::setShadowingEnabled(bool enabled) {
  pointee()->setShadowingEnabled(enabled);
}

std::string ViewWrapper::getDithering() {
  std::string ditheringStr;
  EnumMapper::convertEnumToJSUnion(pointee()->getDithering(), &ditheringStr);
  return ditheringStr;
}

void ViewWrapper::setDithering(const std::string& dithering) {
  Dithering ditheringEnum;
  EnumMapper::convertJSUnionToEnum(dithering, &ditheringEnum);
  pointee()->setDithering(ditheringEnum);
}

std::string ViewWrapper::getAntiAliasing() {
  std::string antiAliasingStr;
  EnumMapper::convertEnumToJSUnion(pointee()->getAntiAliasing(), &antiAliasingStr);
  return antiAliasingStr;
}

void ViewWrapper::setAntiAliasing(const std::string& antiAliasing) {
  AntiAliasing antiAliasingEnum;
  EnumMapper::convertJSUnionToEnum(antiAliasing, &antiAliasingEnum);
  pointee()->setAntiAliasing(antiAliasingEnum);
}

std::vector<double> ViewWrapper::projectWorldToScreen(std::vector<double> worldCoordinates) {
  if (worldCoordinates.size() != 3) {
    [[unlikely]];
    throw std::invalid_argument("worldCoordinates must be an array of 3 elements");
  }

  // Get camera
  Camera& camera = pointee()->getCamera();
  // Get viewport
  Viewport viewport = pointee()->getViewport();
  // Get projection matrix
  math::mat4 projectionMatrix = camera.getProjectionMatrix();
  // Get view matrix
  math::mat4 viewMatrix = camera.getViewMatrix();

  // World coords to vec4
  math::float4 worldCoordinatesFloat4 = math::float4(worldCoordinates[0], worldCoordinates[1], worldCoordinates[2], 1.0f);

  // Transform to camera view space
  math::float4 viewSpaceCoordinates = viewMatrix * worldCoordinatesFloat4;

  // Transform to clip space
  math::float4 clipSpaceCoordinates = projectionMatrix * viewSpaceCoordinates;

  // Normalize to device coordinates (NDC)
  math::float2 ndc;
  ndc.x = clipSpaceCoordinates.x / clipSpaceCoordinates.w;
  ndc.y = clipSpaceCoordinates.y / clipSpaceCoordinates.w;

  float screenWidth = viewport.width / _densityPixelRatio;
  float screenHeight = viewport.height / _densityPixelRatio;

  // Map NDC to screen coordinates
  std::vector<double> screenCoordinates(2);
  screenCoordinates[0] = (ndc.x + 1.0) * (screenWidth / 2.0);
  screenCoordinates[1] = screenHeight * (1.0 - ((ndc.y + 1.0) / 2.0));

  return screenCoordinates;
}

std::future<std::optional<std::shared_ptr<EntityWrapper>>> ViewWrapper::pickEntity(double x, double y) {
  std::promise<std::optional<std::shared_ptr<EntityWrapper>>> promise;
  std::future<std::optional<std::shared_ptr<EntityWrapper>>> future = promise.get_future();

  // Adjust DP value from react native to actual viewport / screen pixel
  x *= _densityPixelRatio;
  y *= _densityPixelRatio;
  // The y coordinate we receive has its origin at the top of the screen, but Filament expects it to be at the bottom
  y = pointee()->getViewport().height - y;

  Logger::log(TAG, "Picking entity at (%f, %f)...", x, y);
  pointee()->pick(x, y, [promise = std::move(promise)](View::PickingQueryResult result) mutable {
    Entity entity = result.renderable;
    if (entity.isNull()) {
      Logger::log(TAG, "No entity picked!");
      promise.set_value(std::nullopt);
    } else {
      Logger::log(TAG, "Entity picked with id %d!", entity.getId());
      std::shared_ptr<EntityWrapper> entityWrapper = std::make_shared<EntityWrapper>(entity);
      promise.set_value(std::optional(entityWrapper));
    }
  });

  return future;
}

} // namespace margelo
