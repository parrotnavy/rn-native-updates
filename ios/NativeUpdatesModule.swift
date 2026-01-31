import React

@objc(NativeUpdatesModule)
public class NativeUpdatesModule: NSObject, RCTBridgeModule {
  private var cachedAppStoreInfo: [String: Any]?
  private var cacheTimestamp: Date?
  private let cacheDuration: TimeInterval = 3600 // 1 hour

  public static func moduleName() -> String! {
    return "NativeUpdates"
  }

  public static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc public func constantsToExport() -> [AnyHashable: Any]! {
    return [
      "currentVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0",
      "buildNumber": Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0",
      "packageName": Bundle.main.bundleIdentifier ?? "",
      "country": getCountryCode()
    ]
  }

  private func getCountryCode() -> String {
    if #available(iOS 16, *) {
      return Locale.current.region?.identifier ?? "US"
    } else {
      return Locale.current.regionCode ?? "US"
    }
  }

  @objc func getAppStoreVersion(_ country: String?, forceRefresh: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    Task {
      do {
        if !forceRefresh,
           let cached = self.cachedAppStoreInfo,
           let timestamp = self.cacheTimestamp,
           Date().timeIntervalSince(timestamp) < self.cacheDuration {
          resolve(cached)
          return
        }

        guard let bundleId = Bundle.main.bundleIdentifier else {
          throw AppStoreError.invalidBundleId
        }

        let countryCode = country ?? getCountryCode()
        let timestamp = Int(Date().timeIntervalSince1970)
        let urlString = "https://itunes.apple.com/lookup?bundleId=\(bundleId)&country=\(countryCode)&date=\(timestamp)"

        guard let url = URL(string: urlString) else {
          throw AppStoreError.invalidURL
        }

        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
          throw AppStoreError.networkError
        }

        if httpResponse.statusCode == 429 {
          throw AppStoreError.rateLimited
        }

        if httpResponse.statusCode != 200 {
          throw AppStoreError.networkError
        }

        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
              let results = json["results"] as? [[String: Any]],
              let first = results.first else {
          throw AppStoreError.appNotFound
        }

        let result: [String: Any] = [
          "version": first["version"] as? String ?? "",
          "trackId": first["trackId"] as? Int ?? 0,
          "trackViewUrl": first["trackViewUrl"] as? String ?? "",
          "currentVersionReleaseDate": first["currentVersionReleaseDate"] as? String ?? "",
          "releaseNotes": first["releaseNotes"] as? String as Any,
          "minimumOsVersion": first["minimumOsVersion"] as? String ?? ""
        ]

        self.cachedAppStoreInfo = result
        self.cacheTimestamp = Date()

        resolve(result)
      } catch let error as AppStoreError {
        let code: String
        switch error {
        case .invalidBundleId:
          code = "INVALID_BUNDLE_ID"
        case .invalidURL:
          code = "INVALID_URL"
        case .networkError:
          code = "NETWORK_ERROR"
        case .appNotFound:
          code = "APP_NOT_FOUND"
        case .rateLimited:
          code = "RATE_LIMITED"
        }
        reject(code, error.localizedDescription, error)
      } catch {
        reject("UNKNOWN", error.localizedDescription, error)
      }
    }
  }
}
