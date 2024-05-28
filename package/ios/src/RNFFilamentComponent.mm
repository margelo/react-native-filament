//
//  RNFFilamentView.m
//  react-native-filament
//
//  Created by Hanno Gödecke on 27.05.24.
//

#ifdef RCT_NEW_ARCH_ENABLED
#import "RNFFilamentComponent.h"

#import <react/renderer/components/rnfilament/ComponentDescriptors.h>
#import <react/renderer/components/rnfilament/EventEmitters.h>
#import <react/renderer/components/rnfilament/Props.h>
#import <react/renderer/components/rnfilament/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"

using namespace facebook::react;

@interface FilamentComponent () <RCTFilamentViewViewProtocol>
@end

@implementation FilamentComponent {
    FilamentMetalView *_filamentMetalView;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<FilamentViewComponentDescriptor>();
}

- (FilamentMetalView *)filamentMetalView
{
  return _filamentMetalView;
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const FilamentViewProps>();
    _props = defaultProps;
    _filamentMetalView = [[FilamentMetalView alloc] initWithFrame:self.bounds];
    
    [self setupOnViewReady];
    
    self.contentView = _filamentMetalView;
  }

  return self;
}

- (void)setupOnViewReady {
  // Get a weak self reference to avoid retain cycles
  __weak FilamentComponent *weakSelf = self;
    
  // Assign the onViewReady block
  _filamentMetalView.onViewReady = ^(NSDictionary *eventInfo) {
    FilamentComponent *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }
    const FilamentViewEventEmitter& eventEmitter = static_cast<const FilamentViewEventEmitter&>(*strongSelf->_eventEmitter);
    eventEmitter.onViewReady(FilamentViewEventEmitter::OnViewReady{});
  };
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<FilamentViewProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<FilamentViewProps const>(props);

  // TODO: Not sure if we need to update the onViewReady callback here, but we don't get it as a prop?
  if (oldViewProps.enableTransparentRendering != newViewProps.enableTransparentRendering) {
    _filamentMetalView.enableTransparentRendering = newViewProps.enableTransparentRendering;
  }

  [super updateProps:props oldProps:oldProps];
}

@end

Class<RCTComponentViewProtocol> FilamentViewCls(void)
{
    return FilamentComponent.class;
}

#endif
