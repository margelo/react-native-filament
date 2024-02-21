//
// Created by Marc Rousavy on 21.02.24.
//

#include "JNISharedPtr.h"

namespace margelo {

void GlobalRefDeleter::operator()(jni::global_ref<jobject> *ref) {
    if (ref) {
        ref->release();
        delete ref;
    }
}

template<typename T, typename std::enable_if<std::is_base_of<jni::HybridClass<T>, T>::value>::type *>
std::shared_ptr<T> JNISharedPtr::make_shared_from_jni(jni::global_ref<typename T::javaobject> ref) {
    return std::shared_ptr<T>(ref->cthis(), GlobalRefDeleter {});
}

} // margelo