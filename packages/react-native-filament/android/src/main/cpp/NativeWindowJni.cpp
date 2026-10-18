#include <android/native_window_jni.h>
#include <jni.h>

extern "C" JNIEXPORT jlong JNICALL Java_com_margelo_nitro_filament_NativeWindow_acquire(JNIEnv* env, jobject, jobject surface) {
  return reinterpret_cast<jlong>(ANativeWindow_fromSurface(env, surface));
}

extern "C" JNIEXPORT void JNICALL Java_com_margelo_nitro_filament_NativeWindow_release(JNIEnv*, jobject, jlong window) {
  ANativeWindow_release(reinterpret_cast<ANativeWindow*>(window));
}
