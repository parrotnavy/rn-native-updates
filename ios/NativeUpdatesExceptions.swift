enum AppStoreError: Error {
  case invalidBundleId
  case invalidURL
  case networkError
  case appNotFound
  case rateLimited
}

extension AppStoreError: CustomStringConvertible {
  var description: String {
    switch self {
    case .invalidBundleId:
      return "Invalid bundle identifier"
    case .invalidURL:
      return "Invalid App Store URL"
    case .networkError:
      return "Network request failed"
    case .appNotFound:
      return "App not found on App Store"
    case .rateLimited:
      return "App Store API rate limit exceeded"
    }
  }
}
