project(RNFilament)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME "RNFilament")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

# Third party libraries (Prefabs)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_library(LOG_LIB log)

# Add react-native-filament sources
add_library(
        ${PACKAGE_NAME}
        SHARED
        # Shared C++
        ../cpp/FilamentView.cpp
        ../cpp/FilamentProxy.cpp
        ../cpp/Surface.cpp
        ../cpp/SurfaceProvider.cpp
        ../cpp/Listener.cpp
        ../cpp/jsi/Promise.cpp
        # Java JNI
        src/main/cpp/AndroidFilamentProxy.cpp
        src/main/cpp/AndroidSurface.cpp
        src/main/cpp/Filament.cpp
        src/main/cpp/FilamentInstaller.cpp
        src/main/cpp/java-bindings/JFilamentProxy.cpp
        src/main/cpp/java-bindings/JFilamentView.cpp
        src/main/cpp/java-bindings/JSurfaceProvider.cpp
)

# Header Search Paths (includes)
target_include_directories(
        ${PACKAGE_NAME}
        PRIVATE
        "../cpp"
        "src/main/cpp"
        "src/main/cpp/java-bindings"
        "${NODE_MODULES_DIR}/react-native/ReactCommon"
        "${NODE_MODULES_DIR}/react-native/ReactCommon/callinvoker"
        "${NODE_MODULES_DIR}/react-native/ReactAndroid/src/main/jni/react/turbomodule" # <-- CallInvokerHolder JNI wrapper
)

# Link everything together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB}                          # <-- Logcat logger
        android                             # <-- Android JNI core
        ReactAndroid::jsi                   # <-- RN: JSI
        ReactAndroid::reactnativejni        # <-- RN: React Native JNI bindings
        fbjni::fbjni                        # <-- fbjni
        GLESv2                              # <-- OpenGL (Core)
        EGL                                 # <-- OpenGL (EGL)
)
