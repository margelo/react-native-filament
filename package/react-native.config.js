// https://github.com/react-native-community/cli/blob/main/docs/dependencies.md

module.exports = {
  dependency: {
    platforms: {
      /**
       * @type {import('@react-native-community/cli-types').IOSDependencyParams}
       */
      ios: {},
      /**
       * @type {import('@react-native-community/cli-types').AndroidDependencyParams}
       */
      android: {
        // The c++ native part of the module will be built inside of the main app,
        // by adding our libraries CMakelists.txt to the main app's CMakelists.txt
        cxxModuleCMakeListsModuleName: 'react-native-filament',
        cxxModuleCMakeListsPath: 'CMakeLists.txt',
      },
    },
  },
}
