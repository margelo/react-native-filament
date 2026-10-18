require "digest"
require "fileutils"
require "json"
require "securerandom"

module RNFFilament
  LIBRARIES = %w[
    gltfio_core filament backend smol-v ktxreader image basis_transcoder camutils geometry mikktspace
    meshoptimizer dracodec uberarchive uberzlib zstd stb filabridge filaflat perfetto abseil utils
  ].freeze

  def self.prepare(package_dir)
    pin = JSON.parse(File.read(File.join(package_dir, "filament.json")))
    asset = pin["assets"]["ios"]
    relative = File.join("ios", "Filament", "sha256-#{asset["sha256"]}")
    vendored = File.join(package_dir, relative)
    vendor(ensure_store_entry(pin, asset), vendored) unless File.directory?(vendored)
    {
      version: pin["version"],
      include_dir: File.join(relative, "include"),
      frameworks: LIBRARIES.map { |lib| File.join(relative, "lib", "lib#{lib}.xcframework") },
    }
  end

  def self.ensure_store_entry(pin, asset)
    entry = File.join(Dir.home, "Library", "Caches", "react-native-filament", "sha256-#{asset["sha256"]}")
    dist = File.join(entry, "dist")
    return dist if File.directory?(dist)

    FileUtils.mkdir_p(entry)
    archive = File.join(entry, "archive.tgz")
    publish(fetch_verified(pin, asset, entry), archive) unless File.file?(archive)
    extracted = extract_validated(archive, entry)
    publish(File.join(extracted, "filament"), dist)
    FileUtils.rm_rf(extracted)
    dist
  end

  def self.fetch_verified(pin, asset, entry)
    part = File.join(entry, "archive.#{SecureRandom.hex(6)}.part")
    local = ENV["RNF_FILAMENT_IOS_ARCHIVE"]
    if local
      FileUtils.cp(local, part)
    else
      url = "#{ENV.fetch("RNF_FILAMENT_BASE_URL", pin["baseUrl"])}/#{asset["name"]}"
      Pod::UI.puts "[react-native-filament] Downloading #{url}"
      unless system("curl", "--fail", "--location", "--silent", "--show-error", "--output", part, url)
        FileUtils.rm_f(part)
        raise "[react-native-filament] Downloading #{url} failed. Set RNF_FILAMENT_IOS_ARCHIVE to a local copy or RNF_FILAMENT_BASE_URL to a mirror."
      end
    end
    actual = Digest::SHA256.file(part).hexdigest
    if actual != asset["sha256"]
      FileUtils.rm_f(part)
      raise "[react-native-filament] #{local || asset["name"]} has SHA-256 #{actual}, expected #{asset["sha256"]}. Set RNF_FILAMENT_IOS_ARCHIVE to a verified copy or RNF_FILAMENT_BASE_URL to a mirror."
    end
    part
  end

  def self.extract_validated(archive, entry)
    listing = IO.popen(["tar", "-tvzf", archive], &:read)
    raise "[react-native-filament] Cannot list #{archive}" unless $?.success?
    listing.each_line do |line|
      kind = line[0]
      name = line.split.last
      unless %w[- d].include?(kind) && (name == "filament/" || name.start_with?("filament/")) && !name.split("/").include?("..")
        raise "[react-native-filament] Unexpected entry '#{line.strip}' in #{archive}"
      end
    end
    tmp = File.join(entry, "dist.#{SecureRandom.hex(6)}.tmp")
    FileUtils.mkdir_p(tmp)
    raise "[react-native-filament] Cannot extract #{archive}" unless system("tar", "-xzf", archive, "-C", tmp)
    tmp
  end

  def self.vendor(dist, vendored)
    tmp = "#{vendored}.#{SecureRandom.hex(6)}.tmp"
    FileUtils.mkdir_p(File.join(tmp, "lib"))
    copy(File.join(dist, "include"), tmp)
    LIBRARIES.each { |lib| copy(File.join(dist, "lib", "lib#{lib}.xcframework"), File.join(tmp, "lib")) }
    publish(tmp, vendored)
  end

  def self.copy(source, target_dir)
    raise "[react-native-filament] Cannot copy #{source}" unless system("cp", "-cR", source, target_dir)
  end

  def self.publish(source, target)
    File.rename(source, target)
  rescue Errno::EEXIST, Errno::ENOTEMPTY
    FileUtils.rm_rf(source)
  end
end
