const { withPodfile } = require('expo/config-plugins')

const MINIMUM = '15.1'
const RAISE_DEPLOYMENT_TARGETS = `    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        if build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${MINIMUM}
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MINIMUM}'
        end
      end
    end
`

/** Raises pods that declare an iOS deployment target Xcode no longer accepts, as the CLI example's Podfile does. */
module.exports = function withMinimumPodDeploymentTarget(config) {
  return withPodfile(config, (podfile) => {
    const { contents } = podfile.modResults
    if (!contents.includes(RAISE_DEPLOYMENT_TARGETS)) {
      podfile.modResults.contents = contents.replace('post_install do |installer|\n', `post_install do |installer|\n${RAISE_DEPLOYMENT_TARGETS}`)
    }
    return podfile
  })
}
