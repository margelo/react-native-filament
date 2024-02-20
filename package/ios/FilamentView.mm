#ifdef RCT_NEW_ARCH_ENABLED
#import "FilamentView.h"

#import <react/renderer/components/RNFilamentViewSpec/ComponentDescriptors.h>
#import <react/renderer/components/RNFilamentViewSpec/EventEmitters.h>
#import <react/renderer/components/RNFilamentViewSpec/Props.h>
#import <react/renderer/components/RNFilamentViewSpec/RCTComponentViewHelpers.h>

#import "RCTFabricComponentsPlugins.h"
#import "Utils.h"

using namespace facebook::react;

@interface FilamentView () <RCTFilamentViewViewProtocol>

@end

@implementation FilamentView {
    UIView * _view;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
    return concreteComponentDescriptorProvider<FilamentViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    static const auto defaultProps = std::make_shared<const FilamentViewProps>();
    _props = defaultProps;

    _view = [[UIView alloc] init];

    self.contentView = _view;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
    const auto &oldViewProps = *std::static_pointer_cast<FilamentViewProps const>(_props);
    const auto &newViewProps = *std::static_pointer_cast<FilamentViewProps const>(props);

    if (oldViewProps.color != newViewProps.color) {
        NSString * colorToConvert = [[NSString alloc] initWithUTF8String: newViewProps.color.c_str()];
        [_view setBackgroundColor: [Utils hexStringToColor:colorToConvert]];
    }

    [super updateProps:props oldProps:oldProps];
}

Class<RCTComponentViewProtocol> FilamentViewCls(void)
{
    return FilamentView.class;
}

@end
#endif
