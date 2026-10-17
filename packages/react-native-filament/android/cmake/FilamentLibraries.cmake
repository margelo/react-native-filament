file(READ "${CMAKE_SOURCE_DIR}/../filament.json" FILAMENT_PIN)
string(JSON FILAMENT_VERSION GET "${FILAMENT_PIN}" version)

set(FILAMENT_LIBS
  gltfio_core
  filament
  backend
  bluevk
  smol-v
  ktxreader
  image
  basis_transcoder
  camutils
  geometry
  mikktspace
  meshoptimizer
  dracodec
  uberarchive
  uberzlib
  zstd
  stb
  filabridge
  filaflat
  perfetto
  abseil
  utils
)

foreach(lib IN LISTS FILAMENT_LIBS)
  add_library(filament_${lib} STATIC IMPORTED)
  set_target_properties(filament_${lib} PROPERTIES
    IMPORTED_LOCATION "${FILAMENT_DIST_DIR}/lib/${ANDROID_ABI}/lib${lib}.a")
endforeach()
list(TRANSFORM FILAMENT_LIBS PREPEND filament_ OUTPUT_VARIABLE FILAMENT_TARGETS)

target_include_directories(${PACKAGE_NAME} PRIVATE "${FILAMENT_DIST_DIR}/include")
target_compile_definitions(${PACKAGE_NAME} PRIVATE RNF_FILAMENT_VERSION="${FILAMENT_VERSION}")
target_link_libraries(${PACKAGE_NAME} ${FILAMENT_TARGETS} EGL GLESv3)
