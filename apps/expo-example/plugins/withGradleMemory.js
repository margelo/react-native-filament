const { withGradleProperties } = require('expo/config-plugins')

const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m'

/** Gives Gradle enough memory for release builds of the native libraries. */
module.exports = function withGradleMemory(config) {
  return withGradleProperties(config, (gradle) => {
    const others = gradle.modResults.filter((item) => item.type !== 'property' || item.key !== 'org.gradle.jvmargs')
    gradle.modResults = [...others, { type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS }]
    return gradle
  })
}
