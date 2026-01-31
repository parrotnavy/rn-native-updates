#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NativeUpdatesModule, NSObject)

RCT_EXTERN_METHOD(getAppStoreVersion:(NSString *)country
                  forceRefresh:(BOOL)forceRefresh
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
