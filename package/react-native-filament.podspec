require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
folly_compiler_flags = '-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1 -Wno-comma -Wno-shorten-64-to-32'

Pod::Spec.new do |s|
  s.name         = "react-native-filament"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/margelo/react-native-filament.git", :tag => "#{s.version}" }

  s.pod_target_xcconfig = {
    'GCC_PREPROCESSOR_DEFINITIONS' => 'FILAMENT_APP_USE_METAL=1 $(inherited)',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++17',
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/cpp/**\" \"$(PODS_TARGET_SRCROOT)/ios/libs/bullet3/**\""
  }

  # Fix linking error with Xcode 12; we do not yet support the simulator on Apple silicon.
  # s.pod_target_xcconfig = {
  #   'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64'
  # }
  # s.user_target_xcconfig = { 'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => 'arm64' }

  # Configure sub podspecs for filament
  s.subspec "filament" do |ss|
    ss.source_files =
        "ios/libs/filament/include/filament/*.h",
        "ios/libs/filament/include/backend/*.h",
        "ios/libs/filament/include/filament/MaterialChunkType.h",
        "ios/libs/filament/include/filament/MaterialEnums.h",
        "ios/libs/filament/include/ibl/*.h",
        "ios/libs/filament/include/geometry/*.h"
    ss.header_mappings_dir = "ios/libs/filament/include"
    ss.vendored_frameworks =
        "ios/libs/filament/lib/libfilament.xcframework",
        "ios/libs/filament/lib/libbackend.xcframework",
        "ios/libs/filament/lib/libfilabridge.xcframework",
        "ios/libs/filament/lib/libfilaflat.xcframework",
        "ios/libs/filament/lib/libibl.xcframework",
        "ios/libs/filament/lib/libgeometry.xcframework"
    ss.dependency "react-native-filament/utils"
    ss.dependency "react-native-filament/math"
  end

  s.subspec "camutils" do |ss|
    ss.source_files = "ios/libs/filament/include/camutils/*.h"
    ss.vendored_frameworks = "ios/libs/filament/lib/libcamutils.xcframework"
    ss.header_dir = "camutils"
    ss.dependency "react-native-filament/math"
  end

  s.subspec "utils" do |ss|
    ss.source_files = "ios/libs/filament/include/utils/**/*.h"
    ss.header_mappings_dir = "ios/libs/filament/include"
    ss.vendored_frameworks = "ios/libs/filament/lib/libutils.xcframework"
    ss.dependency "react-native-filament/tsl"
  end

  s.subspec "tsl" do |ss|
    ss.source_files = "ios/libs/filament/include/tsl/*.h"
    ss.header_dir = "tsl"
  end

  s.subspec "math" do |ss|
    ss.source_files = "ios/libs/filament/include/math/*.h"
    ss.header_dir = "math"
  end

  s.subspec "filamat" do |ss|
    ss.source_files =
        "ios/libs/filament/include/filamat/*.h",
        "ios/libs/filament/include/filament/MaterialChunkType.h",
        "ios/libs/filament/include/filament/MaterialEnums.h"
    ss.header_mappings_dir = "ios/libs/filament/include"
    ss.vendored_frameworks =
      "ios/libs/filament/lib/libfilamat.xcframework",
      "ios/libs/filament/lib/libshaders.xcframework",
      "ios/libs/filament/lib/libsmol-v.xcframework",
      "ios/libs/filament/lib/libfilabridge.xcframework"
    ss.dependency "react-native-filament/utils"
    ss.dependency "react-native-filament/math"
  end

  s.subspec "image" do |ss|
    ss.source_files = "ios/libs/filament/include/image/*.h"
    ss.vendored_frameworks = "ios/libs/filament/lib/libimage.xcframework"
    ss.header_dir = "image"
    ss.dependency "react-native-filament/filament"
  end

  s.subspec "ktxreader" do |ss|
    ss.source_files = "ios/libs/filament/include/ktxreader/*.h"
    ss.header_mappings_dir = "ios/libs/filament/include"
    ss.vendored_frameworks =
        "ios/libs/filament/lib/libktxreader.xcframework",
        "ios/libs/filament/lib/libbasis_transcoder.xcframework"
    ss.dependency "react-native-filament/image"
    ss.dependency "react-native-filament/filament"
  end

  s.subspec "uberz" do |ss|
    ss.source_files = "ios/libs/filament/include/uberz/*.h"
    ss.header_mappings_dir = "ios/libs/filament/include"
    ss.vendored_frameworks =
        "ios/libs/filament/lib/libuberzlib.xcframework",
        "ios/libs/filament/lib/libzstd.xcframework"
    ss.header_dir = "uberz"
    ss.dependency "react-native-filament/filamat"
    ss.dependency "react-native-filament/tsl"
    ss.dependency "react-native-filament/utils"
  end

  s.subspec "gltfio_core" do |ss|
    ss.source_files = "ios/libs/filament/include/gltfio/**/*.h"
    ss.header_mappings_dir = "ios/libs/filament/include"
    ss.vendored_frameworks =
      "ios/libs/filament/lib/libgltfio_core.xcframework",
      "ios/libs/filament/lib/libdracodec.xcframework",
      "ios/libs/filament/lib/libuberarchive.xcframework",
      "ios/libs/filament/lib/libstb.xcframework"
    ss.dependency "react-native-filament/filament"
    ss.dependency "react-native-filament/ktxreader"
    ss.dependency "react-native-filament/uberz"
  end

  # All source files that should be publicly visible
  # Note how this does not include headers, since those can nameclash.
  s.source_files = [
    "cpp/**/*.{h,c,cpp}",
    "ios/src/**/*.{h,m,mm,cpp}",
    "ios/libs/bullet3/**/*.{h,c,cpp}"
  ]

  # Any private headers that are not globally unique should be mentioned here.
  # Otherwise there will be a nameclash, since CocoaPods flattens out any header directories
  # See https://github.com/firebase/firebase-ios-sdk/issues/4035 for more details.
  s.preserve_paths = [
    "cpp/**/*.h",
    "ios/src/*.h"
  ]

  s.dependency "react-native-worklets-core"

  # Use install_modules_dependencies helper to install the dependencies if React Native version >=0.71.0.
  # See https://github.com/facebook/react-native/blob/febf6b7f33fdb4904669f99d795eba4c0f95d7bf/scripts/cocoapods/new_architecture.rb#L79.
  if respond_to?(:install_modules_dependencies, true)
    install_modules_dependencies(s)
  else
    s.dependency "React-Core"

    # Don't install the dependencies when we run `pod install` in the old architecture.
    if ENV['RCT_NEW_ARCH_ENABLED'] == '1' then
      s.compiler_flags = folly_compiler_flags + " -DRCT_NEW_ARCH_ENABLED=1"
      s.pod_target_xcconfig    = {
          "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/cpp/\"/** \"$(PODS_ROOT)/boost\"",
          "OTHER_CPLUSPLUSFLAGS" => "-DFOLLY_NO_CONFIG -DFOLLY_MOBILE=1 -DFOLLY_USE_LIBCPP=1",
          "CLANG_CXX_LANGUAGE_STANDARD" => "c++17"
      }
      s.dependency "React-RCTFabric"
      s.dependency "React-Codegen"
      s.dependency "RCT-Folly"
      s.dependency "RCTRequired"
      s.dependency "RCTTypeSafety"
      s.dependency "ReactCommon/turbomodule/core"
    end
  end
end
