const fs = require('fs')
const path = require('path')
const { IOSConfig, withAppDelegate, withDangerousMod, withInfoPlist, withXcodeProject } = require('expo/config-plugins')

const WINDOW_SETUP = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`

/**
 * Adopts the UIScene lifecycle, which apps built with the current iOS SDK need to launch, by starting React Native from a
 * SceneDelegate instead of the AppDelegate, as the CLI example does.
 */
module.exports = function withSceneLifecycle(config) {
  config = withInfoPlist(config, (plist) => {
    plist.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          { UISceneConfigurationName: 'Default Configuration', UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate' },
        ],
      },
    }
    return plist
  })
  config = withAppDelegate(config, (appDelegate) => {
    const { contents } = appDelegate.modResults
    appDelegate.modResults.contents = contents.replace(WINDOW_SETUP, '')
    return appDelegate
  })
  config = withDangerousMod(config, [
    'ios',
    (modConfig) => {
      const projectName = IOSConfig.XcodeUtils.getProjectName(modConfig.modRequest.projectRoot)
      const destination = path.join(modConfig.modRequest.platformProjectRoot, projectName, 'SceneDelegate.swift')
      fs.copyFileSync(path.join(__dirname, 'SceneDelegate.swift'), destination)
      return modConfig
    },
  ])
  return withXcodeProject(config, (project) => {
    const projectName = IOSConfig.XcodeUtils.getProjectName(project.modRequest.projectRoot)
    const filepath = `${projectName}/SceneDelegate.swift`
    if (!project.modResults.hasFile(filepath)) {
      IOSConfig.XcodeUtils.addBuildSourceFileToGroup({ filepath, groupName: projectName, project: project.modResults })
    }
    return project
  })
}
