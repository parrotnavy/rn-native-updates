package com.parrotnavy.nativeupdates

import android.content.pm.PackageManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import java.util.Locale

class NativeUpdatesModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private var appUpdateManager: AppUpdateManager? = null
  private var installStateListener: InstallStateUpdatedListener? = null

  override fun getName(): String = "NativeUpdates"

  override fun getConstants(): MutableMap<String, Any> {
    val packageName = reactApplicationContext.packageName
    val packageInfo = try {
      reactApplicationContext.packageManager.getPackageInfo(packageName, 0)
    } catch (e: PackageManager.NameNotFoundException) {
      null
    }

    return mutableMapOf(
      "currentVersion" to (packageInfo?.versionName ?: "0.0.0"),
      "buildNumber" to (packageInfo?.longVersionCode?.toString() ?: "0"),
      "packageName" to packageName,
      "country" to Locale.getDefault().country
    )
  }

  override fun initialize() {
    super.initialize()
    appUpdateManager = AppUpdateManagerFactory.create(reactApplicationContext)
  }

  override fun onCatalystInstanceDestroy() {
    installStateListener?.let {
      appUpdateManager?.unregisterListener(it)
    }
    super.onCatalystInstanceDestroy()
  }

  @ReactMethod
  fun checkPlayStoreUpdate(promise: Promise) {
    val manager = appUpdateManager ?: run {
      promise.reject("PLAY_STORE_NOT_AVAILABLE", "Play Store is not available on this device")
      return
    }

    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        val result = Arguments.createMap().apply {
          putInt("updateAvailability", info.updateAvailability())
          if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) {
            putInt("availableVersionCode", info.availableVersionCode())
          } else {
            putNull("availableVersionCode")
          }
          putBoolean("isFlexibleUpdateAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE))
          putBoolean("isImmediateUpdateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE))
          val stalenessDays = info.clientVersionStalenessDays()
          if (stalenessDays != null) {
            putInt("clientVersionStalenessDays", stalenessDays)
          } else {
            putNull("clientVersionStalenessDays")
          }
          putInt("updatePriority", info.updatePriority())
          putDouble("totalBytesToDownload", info.totalBytesToDownload().toDouble())
          putString("packageName", info.packageName())
        }
        promise.resolve(result)
      }
      .addOnFailureListener { e ->
        if (e.message?.contains("API not available") == true ||
            e.message?.contains("not installed from Play Store") == true) {
          promise.reject("NOT_FROM_PLAY_STORE", "App was not installed from Play Store")
        } else {
          promise.reject("CHECK_FAILED", "Failed to check for updates${e.message?.let { ": $it" } ?: ""}")
        }
      }
  }

  @ReactMethod
  fun startUpdate(updateType: Int, promise: Promise) {
    val manager = appUpdateManager ?: run {
      promise.reject("PLAY_STORE_NOT_AVAILABLE", "Play Store is not available on this device")
      return
    }

    val activity = currentActivity ?: run {
      promise.reject("NO_ACTIVITY", "No activity available to start update flow")
      return
    }

    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) {
          promise.reject("UPDATE_NOT_AVAILABLE", "No update is available")
          return@addOnSuccessListener
        }

        if (updateType == AppUpdateType.FLEXIBLE) {
          installStateListener = InstallStateUpdatedListener { state ->
            val progress = if (state.totalBytesToDownload() > 0) {
              ((state.bytesDownloaded() * 100) / state.totalBytesToDownload()).toInt()
            } else 0

            when (state.installStatus()) {
              InstallStatus.DOWNLOADING -> {
                reactApplicationContext
                  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                  .emit("onUpdateProgress", Arguments.createMap().apply {
                    putInt("installStatus", state.installStatus())
                    putDouble("bytesDownloaded", state.bytesDownloaded().toDouble())
                    putDouble("totalBytesToDownload", state.totalBytesToDownload().toDouble())
                    putInt("downloadProgress", progress)
                  })
              }
              InstallStatus.DOWNLOADED -> {
                reactApplicationContext
                  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                  .emit("onUpdateDownloaded", Arguments.createMap().apply {
                    putInt("installStatus", state.installStatus())
                    putDouble("bytesDownloaded", state.bytesDownloaded().toDouble())
                    putDouble("totalBytesToDownload", state.totalBytesToDownload().toDouble())
                    putInt("downloadProgress", 100)
                  })
              }
              InstallStatus.INSTALLED -> {
                reactApplicationContext
                  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                  .emit("onUpdateInstalled", Arguments.createMap().apply {
                    putInt("installStatus", state.installStatus())
                  })
                installStateListener?.let { manager.unregisterListener(it) }
              }
              InstallStatus.FAILED, InstallStatus.CANCELED -> {
                reactApplicationContext
                  .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                  .emit("onUpdateFailed", Arguments.createMap().apply {
                    putInt("installStatus", state.installStatus())
                  })
                installStateListener?.let { manager.unregisterListener(it) }
              }
              else -> {}
            }
          }
          manager.registerListener(installStateListener!!)
        }

        val options = AppUpdateOptions.newBuilder(updateType).build()

        manager.startUpdateFlow(info, activity, options)
          .addOnSuccessListener {
            promise.resolve(null)
          }
          .addOnFailureListener { e ->
            promise.reject("UPDATE_FAILED", "Failed to start update${e.message?.let { ": $it" } ?: ""}")
          }
      }
      .addOnFailureListener { e ->
        promise.reject("CHECK_FAILED", "Failed to check for updates${e.message?.let { ": $it" } ?: ""}")
      }
  }

  @ReactMethod
  fun completeUpdate() {
    appUpdateManager?.completeUpdate()
  }
}
