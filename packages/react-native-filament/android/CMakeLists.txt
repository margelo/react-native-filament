cmake_minimum_required(VERSION 3.22.1)
project(NitroFilament)

set(PACKAGE_NAME NitroFilament)
set(CMAKE_CXX_STANDARD 20)

file(GLOB_RECURSE RNF_SOURCES CONFIGURE_DEPENDS
  "${CMAKE_SOURCE_DIR}/src/main/cpp/*.cpp"
  "${CMAKE_SOURCE_DIR}/../cpp/*.cpp"
)
add_library(${PACKAGE_NAME} SHARED ${RNF_SOURCES})

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
target_link_libraries(${PACKAGE_NAME} ${LOG_LIB} android z react-native-worklets::worklets)
target_link_options(${PACKAGE_NAME} PRIVATE "-Wl,--no-undefined" "-Wl,--gc-sections")
