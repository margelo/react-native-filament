#pragma once

#include "AssetUri.hpp"

#include <NitroModules/ArrayBuffer.hpp>
#include <NitroModules/Promise.hpp>

#include <memory>
#include <variant>

namespace margelo::nitro::filament {

using AssetSource = std::variant<std::shared_ptr<ArrayBuffer>, AssetUri>;

std::shared_ptr<Promise<std::shared_ptr<ArrayBuffer>>> readAssetBytes(const AssetSource& source);
std::string temporaryDirectory();

} // namespace margelo::nitro::filament
