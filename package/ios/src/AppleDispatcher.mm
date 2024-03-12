//
//  AppleDispatcher.mm
//  react-native-filament
//
//  Created by Marc Rousavy on 12.03.24.
//

#include "AppleDispatcher.h"
#include <Foundation/Foundation.h>

namespace margelo {

void AppleDispatcher::scheduleTrigger() {
  dispatch_async(_dispatchQueue, ^{
    trigger();
  });
}

}
