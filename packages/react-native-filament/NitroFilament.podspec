require "json"
require_relative "ios/filament"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))
filament = RNFFilament.prepare(__dir__)

Pod::Spec.new do |s|
  s.name         = "NitroFilament"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/margelo/react-native-filament.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{swift}",
    "ios/**/*.{m,mm}",
    "cpp/**/*.{hpp,cpp}",
  ]

  s.subspec "Bullet" do |bullet|
    bullet.source_files = "vendor/bullet3/src/**/*.{h,cpp}"
    bullet.compiler_flags = "-w"
  end

  s.resources = ["assets/*"]
  s.vendored_frameworks = filament[:frameworks]
  s.frameworks = ["Metal", "QuartzCore", "CoreVideo"]
  s.libraries = ["z"]
  s.pod_target_xcconfig = {
    "HEADER_SEARCH_PATHS" => "\"$(PODS_TARGET_SRCROOT)/#{filament[:include_dir]}\" \"$(PODS_TARGET_SRCROOT)/cpp\" \"$(PODS_TARGET_SRCROOT)/vendor/bullet3/src\"",
    "GCC_PREPROCESSOR_DEFINITIONS" => "$(inherited) RNF_FILAMENT_VERSION=\\\"#{filament[:version]}\\\"",
    "SWIFT_ENABLE_EXPLICIT_MODULES" => "NO",
  }

  load "nitrogen/generated/ios/NitroFilament+autolinking.rb"
  add_nitrogen_files(s)

  s.dependency "RNWorklets"
  s.dependency "React-jsi"
  s.dependency "React-callinvoker"
  install_modules_dependencies(s)
end
