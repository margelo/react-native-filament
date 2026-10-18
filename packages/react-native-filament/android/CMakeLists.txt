cmake_minimum_required(VERSION 3.22.1)
project(NitroFilament)

set(PACKAGE_NAME NitroFilament)
set(CMAKE_CXX_STANDARD 20)

file(GLOB_RECURSE RNF_SOURCES CONFIGURE_DEPENDS
  "${CMAKE_SOURCE_DIR}/src/main/cpp/*.cpp"
  "${CMAKE_SOURCE_DIR}/../cpp/*.cpp"
)
add_library(${PACKAGE_NAME} SHARED ${RNF_SOURCES})

file(GLOB_RECURSE BULLET_SOURCES CONFIGURE_DEPENDS "${CMAKE_SOURCE_DIR}/../vendor/bullet3/src/*.cpp")
add_library(bullet3 STATIC ${BULLET_SOURCES})
target_include_directories(bullet3 SYSTEM PUBLIC "${CMAKE_SOURCE_DIR}/../vendor/bullet3/src")
target_compile_options(bullet3 PRIVATE -w)
set_target_properties(bullet3 PROPERTIES POSITION_INDEPENDENT_CODE ON)

include(${CMAKE_SOURCE_DIR}/../nitrogen/generated/android/NitroFilament+autolinking.cmake)
include(${CMAKE_SOURCE_DIR}/cmake/FilamentLibraries.cmake)

target_include_directories(${PACKAGE_NAME} PRIVATE
  "${CMAKE_SOURCE_DIR}/src/main/cpp"
  "${CMAKE_SOURCE_DIR}/../cpp"
  "${CMAKE_SOURCE_DIR}/../cpp/engine"
  "${REACT_NATIVE_DIR}/ReactCommon"
  "${REACT_NATIVE_DIR}/ReactCommon/jsiexecutor"
)
target_compile_definitions(${PACKAGE_NAME} PRIVATE __ANDROID_UNAVAILABLE_SYMBOLS_ARE_WEAK__)
target_compile_options(${PACKAGE_NAME} PRIVATE -Werror=unguarded-availability)

find_package(react-native-worklets REQUIRED CONFIG)

find_library(LOG_LIB log)
target_link_libraries(${PACKAGE_NAME} ${LOG_LIB} android z bullet3 react-native-worklets::worklets)
target_link_options(${PACKAGE_NAME} PRIVATE "-Wl,--no-undefined" "-Wl,--gc-sections")
