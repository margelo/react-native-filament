#include "ShadowTypeConversion.hpp"

namespace margelo::nitro::filament {

::filament::ShadowType toFilamentShadowType(ShadowType type) {
  switch (type) {
    case ShadowType::PCF:
      return ::filament::ShadowType::PCF;
    case ShadowType::VSM:
      return ::filament::ShadowType::VSM;
    case ShadowType::DPCF:
      return ::filament::ShadowType::DPCF;
    case ShadowType::PCSS:
      return ::filament::ShadowType::PCSS;
  }
  return ::filament::ShadowType::PCF;
}

ShadowType fromFilamentShadowType(::filament::ShadowType type) {
  switch (type) {
    case ::filament::ShadowType::VSM:
      return ShadowType::VSM;
    case ::filament::ShadowType::DPCF:
      return ShadowType::DPCF;
    case ::filament::ShadowType::PCSS:
      return ShadowType::PCSS;
    default:
      return ShadowType::PCF;
  }
}

} // namespace margelo::nitro::filament
