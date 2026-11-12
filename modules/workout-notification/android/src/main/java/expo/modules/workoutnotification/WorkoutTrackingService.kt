package expo.modules.workoutnotification

import android.annotation.SuppressLint
import android.app.Notification
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.IntentCompat

class WorkoutTrackingService : Service() {

  companion object {
    const val EXTRA_NOTIFICATION = "notification"
    private const val TAG = "WorkoutTrackingService"

    @Volatile
    var isRunning = false
      private set
  }

  override fun onBind(intent: Intent?): IBinder? = null

  @SuppressLint("MissingPermission")
  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = intent?.let {
      IntentCompat.getParcelableExtra(it, EXTRA_NOTIFICATION, Notification::class.java)
    }
    if (notification == null) {
      stopSelf()
      return START_NOT_STICKY
    }

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
    } else {
      0
    }

    try {
      ServiceCompat.startForeground(
        this,
        WorkoutNotificationModule.NOTIFICATION_ID,
        notification,
        type
      )
      isRunning = true
    } catch (e: Exception) {
      Log.w(TAG, "Az előtérszolgáltatás nem indult el", e)
      try {
        NotificationManagerCompat.from(this)
          .notify(WorkoutNotificationModule.NOTIFICATION_ID, notification)
      } catch (ignored: Exception) {
      }
      stopSelf()
    }
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    isRunning = false
    super.onDestroy()
  }
}
