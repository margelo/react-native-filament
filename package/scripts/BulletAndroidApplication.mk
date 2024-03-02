APP_MODULES := libBullet
APP_ABI := armeabi-v7a arm64-v8a x86 x86_64
APP_OPTIM := release

APP_PLATFORM := android-31

#We only need STL for placement new (#include <new>) 
#We don't use STL in Bullet
APP_STL                 := c++_static 
