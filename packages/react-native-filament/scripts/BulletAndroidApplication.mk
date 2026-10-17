APP_MODULES := libBullet
APP_ABI := armeabi-v7a arm64-v8a x86 x86_64
APP_OPTIM := release

# {PLATFORM_NAME} is a placeholder and is replaced by the libraries target platform
APP_PLATFORM := android-{PLATFORM_NAME}

#We only need STL for placement new (#include <new>) 
#We don't use STL in Bullet
APP_STL                 := c++_static 
