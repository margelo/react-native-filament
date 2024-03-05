project(RNFilament)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME "RNFilament")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

set(FILAMENT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/libs/filament")

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
        ../cpp/Choreographer.cpp
        ../cpp/Listener.cpp
        ../cpp/jsi/HybridObject.cpp
        ../cpp/jsi/Promise.cpp
        ../cpp/test/TestHybridObject.cpp

        # Filament Core
        ../cpp/core/EngineWrapper.cpp
        ../cpp/core/RendererWrapper.cpp
        ../cpp/core/SceneWrapper.cpp
        ../cpp/core/CameraWrapper.cpp
        ../cpp/core/ViewWrapper.cpp
        ../cpp/core/SwapChainWrapper.cpp
        ../cpp/core/FilamentAssetWrapper.cpp

        # Filament Utils
        ../cpp/core/utils/EntityWrapper.cpp
        ../cpp/core/utils/ManipulatorWrapper.cpp

        # Java JNI
        src/main/cpp/AndroidFilamentProxy.cpp
        src/main/cpp/AndroidSurface.cpp
        src/main/cpp/Filament.cpp
        src/main/cpp/JNISharedPtr.cpp
        src/main/cpp/FilamentInstaller.cpp
        src/main/cpp/java-bindings/JFilamentProxy.cpp
        src/main/cpp/java-bindings/JChoreographer.cpp
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
        "${FILAMENT_DIR}/include"
)

# Link everything together
target_link_libraries(
        ${PACKAGE_NAME}
        ${LOG_LIB} # <-- Logcat logger
        android # <-- Android JNI core
        ReactAndroid::jsi # <-- RN: JSI
        ReactAndroid::reactnativejni # <-- RN: React Native JNI bindings
        fbjni::fbjni # <-- fbjni
        GLESv3 # <-- OpenGL (Core)
        EGL # <-- OpenGL (EGL)
)

# Filament (local CMake project as a git submodule)
message("RN Filament: Adding pre-compiled libraries in ${FILAMENT_DIR}...")
file(GLOB FILAMENT_LIBRARIES "${FILAMENT_DIR}/lib/${ANDROID_ABI}/*.a")

foreach(file ${FILAMENT_LIBRARIES})
        message("RN Filament: Linking ${file}...")
        target_link_libraries(${PACKAGE_NAME} ${file})
endforeach()
