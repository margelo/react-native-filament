//
//  BlockObserver.m
//  DoubleConversion
//
//  Created by Marc Rousavy on 22.02.24.
//

#import "RNFBlockObserver.h"
#import <Foundation/Foundation.h>

@interface BlockObserver ()
@property(nonatomic, copy) ObservationBlock block;
@end

@implementation BlockObserver

- (instancetype)initWithBlock:(ObservationBlock)block {
  if (self = [super init]) {
    _block = [block copy];
  }
  return self;
}

- (void)observeValueForKeyPath:(NSString*)keyPath
                      ofObject:(id)object
                        change:(NSDictionary<NSKeyValueChangeKey, id>*)change
                       context:(void*)context {
  if (self.block) {
    self.block(change, context);
  }
}

@end
