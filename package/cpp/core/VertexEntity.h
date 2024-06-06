//
// Created by Hanno Gödecke on 06.06.24.
//

#pragma once

#include <utils/Entity.h>
#include <filament/VertexBuffer.h>
#include <filament/IndexBuffer.h>

#include <memory>

struct VertexEntity {
  utils::Entity entity;
  std::shared_ptr<filament::VertexBuffer> vertexBuffer;
  std::shared_ptr<filament::IndexBuffer> indexBuffer;
};
