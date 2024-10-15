project(RNFilament)
cmake_minimum_required(VERSION 3.9.0)

set(PACKAGE_NAME "react-native-filament")
set(BUILD_DIR ${CMAKE_SOURCE_DIR}/build)
set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 17)

set(FILAMENT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/libs/filament")
set(BULLET3_DIR "${CMAKE_CURRENT_SOURCE_DIR}/libs/bullet3")

if(CMAKE_BUILD_TYPE STREQUAL "Debug")
    add_definitions(-DDEBUG=1)
endif()

if(RNF_ENABLE_LOGS)
    add_definitions(-DRNF_ENABLE_LOGS=1)
else()
    add_definitions(-DRNF_ENABLE_LOGS=0)
endif()

# Third party libraries (Prefabs)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)
find_library(LOG_LIB log)
find_package(react-native-nitro-modules REQUIRED) # <-- Used to create all HybridObjects and use the Nitro core library

# Add react-native-filament sources
add_library(
    ${PACKAGE_NAME}
    SHARED

    # Shared C++
    ../cpp/RNFFilamentView.cpp
    ../cpp/RNFFilamentProxy.cpp
    ../cpp/RNFFilamentRecorder.cpp
    ../cpp/RNFSurface.cpp
    ../cpp/RNFSurfaceProvider.cpp
    ../cpp/RNFChoreographer.cpp
    ../cpp/RNFChoreographerWrapper.cpp
    ../cpp/RNFListener.cpp
    ../cpp/jsi/RNFPromise.cpp
    ../cpp/jsi/RNFPromiseFactory.cpp
    ../cpp/jsi/RNFRuntimeCache.cpp
    ../cpp/jsi/RNFWorkletRuntimeRegistry.cpp
    ../cpp/threading/RNFDispatcher.cpp

    # Filament Core
    ../cpp/core/RNFEngineImpl.cpp
    ../cpp/core/RNFEngineImpl.Skybox.cpp
    ../cpp/core/RNFEngineWrapper.cpp
    ../cpp/core/RNFEngineConfigHelper.cpp
    ../cpp/core/RNFSceneWrapper.cpp
    ../cpp/core/RNFCameraWrapper.cpp
    ../cpp/core/RNFViewWrapper.cpp
    ../cpp/core/RNFSwapChainWrapper.cpp
    ../cpp/core/RNFFilamentAssetWrapper.cpp
    ../cpp/core/RNFAnimatorWrapper.cpp
    ../cpp/core/RNFTransformManagerImpl.cpp
    ../cpp/core/RNFTransformManagerWrapper.cpp
    ../cpp/core/RNFAABBWrapper.cpp
    ../cpp/core/RNFBoxWrapper.cpp
    ../cpp/core/RNFMaterialInstanceWrapper.cpp
    ../cpp/core/RNFNameComponentManagerWrapper.cpp
    ../cpp/core/RNFRenderableManagerImpl.cpp
    ../cpp/core/RNFRenderableManagerImpl.DebugHelpers.cpp
    ../cpp/core/RNFRenderableManagerWrapper.cpp
    ../cpp/core/RNFMaterialImpl.cpp
    ../cpp/core/RNFMaterialWrapper.cpp
    ../cpp/core/RNFFilamentInstanceWrapper.cpp
    ../cpp/core/RNFLightManagerWrapper.cpp
    ../cpp/core/RNFRendererWrapper.cpp

    # Filament Utils
    ../cpp/core/utils/RNFEntityWrapper.cpp
    ../cpp/core/utils/RNFManipulatorWrapper.cpp

    # Filament math
    ../cpp/core/math/RNFTMat44Wrapper.cpp

    # Bullet Physics Engine
    ../cpp/bullet/RNFBulletWrapper.cpp
    ../cpp/bullet/RNFDiscreteDynamicWorldWrapper.cpp
    ../cpp/bullet/RNFRigidBodyWrapper.cpp
    ../cpp/bullet/RNFShapeWrapper.cpp

    # Java JNI
    src/main/cpp/RNFAndroidFilamentProxy.cpp
    src/main/cpp/RNFAndroidSurface.cpp
    src/main/cpp/RNFFilament.cpp
    src/main/cpp/RNFAndroidLogger.cpp
    src/main/cpp/RNFJNISharedPtr.cpp
    src/main/cpp/RNFFilamentInstaller.cpp
    src/main/cpp/java-bindings/RNFJFilamentProxy.cpp
    src/main/cpp/java-bindings/RNFJFilamentRecorder.cpp
    src/main/cpp/java-bindings/RNFJChoreographer.cpp
    src/main/cpp/java-bindings/RNFJFilamentView.cpp
    src/main/cpp/java-bindings/RNFJDispatcher.cpp
    src/main/cpp/java-bindings/RNFJSurfaceProvider.cpp
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
    "${BULLET3_DIR}/include"
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
    react-native-nitro-modules::NitroModules  # <-- NitroModules Core :)
)

# Link with RNWC:
if (IS_OLD_ARCHITECTURE_ENABLED)
    # On the old arch RNWC publishes a prefab that we need to find (and it has a different name):
    find_package(react-native-worklets-core REQUIRED CONFIG)
    message("RN Filament: react-native-worklets core found! Enabling Worklets support...")
    message("RN Filament: react-native-worklets-core found in ${react-native-worklets-core_DIR}")
    target_link_libraries(
        ${PACKAGE_NAME}
        react-native-worklets-core::rnworklets
    )
else ()
    target_link_libraries(
            ${PACKAGE_NAME}
            react_codegen_rnfilament # link against the codegen generated library of rnf (needed so this module is compiled correctly)
            react-native-worklets-core
    )
endif()
add_definitions(-DHAS_WORKLETS=1)

# Filament (local CMake project as a git submodule)
message("RN Filament: Adding pre-compiled libraries in ${FILAMENT_DIR}...")
file(GLOB FILAMENT_LIBRARIES "${FILAMENT_DIR}/lib/${ANDROID_ABI}/*.a")

foreach(file ${FILAMENT_LIBRARIES})
    message("RN Filament: Linking ${file}...")
    target_link_libraries(${PACKAGE_NAME} ${file})
endforeach()

# Bullet3 (local CMake project as a git submodule)
message("RN Filament: Adding pre-compiled libraries in ${BULLET3_DIR}...")
file(GLOB BULLET3_LIBRARIES "${BULLET3_DIR}/lib/${ANDROID_ABI}/*.a")

foreach(file ${BULLET3_LIBRARIES})
    message("RN Filament: Linking ${file}...")
    target_link_libraries(${PACKAGE_NAME} ${file})
endforeach()
