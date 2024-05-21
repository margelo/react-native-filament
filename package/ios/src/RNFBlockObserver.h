//
//  BlockObserver.h
//  Pods
//
//  Created by Marc Rousavy on 22.02.24.
//

#pragma once

#import <Foundation/Foundation.h>

typedef void (^ObservationBlock)(NSDictionary<NSKeyValueChangeKey, id>* change, void* context);

@interface BlockObserver : NSObject

- (instancetype)initWithBlock:(ObservationBlock)block;

@end
