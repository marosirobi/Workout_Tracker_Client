package expo.modules.workoutnotification
import android.content.ActivityNotFoundException
import android.annotation.SuppressLint
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.provider.Settings
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.lang.ref.WeakReference

class WorkoutNotificationData : Record {
  @Field val title: String = ""
  @Field val text: String = ""
  @Field val chipText: String? = null
  @Field val chronometerBaseMs: Double = 0.0
  @Field val isPaused: Boolean = false
  @Field val accentColor: String = "#FC4C02"
  @Field val keepAlive: Boolean = false
}

class WorkoutNotificationModule : Module() {

  companion object {
    const val CHANNEL_ID = "workout_live_V2"
    const val NOTIFICATION_ID = 4242
    private var instance: WeakReference<WorkoutNotificationModule>? = null

    fun emitAction(action: String) {
      instance?.get()?.sendEvent("onAction", mapOf("action" to action))
    }
  }

  private val context: Context
    get() = appContext.reactContext ?: throw IllegalStateException("Nincs Android context")

  override fun definition() = ModuleDefinition {
    Name("WorkoutNotification")

    Events("onAction")

    OnCreate { instance = WeakReference(this@WorkoutNotificationModule) }
    OnDestroy { instance = null }

    Function("show") { data: WorkoutNotificationData -> showNotification(data) }

    Function("hide") {
      context.stopService(Intent(context, WorkoutTrackingService::class.java))
      NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
    }

    Function("canUsePromoted") {
      if (Build.VERSION.SDK_INT >= 36) {
        context.getSystemService(NotificationManager::class.java).canPostPromotedNotifications()
      } else {
        false
      }
    }

    Function("openPromotedSettings") {
      val promotedIntent = Intent("android.settings.MANAGE_APP_PROMOTED_NOTIFICATIONS")
      .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      val fallbackIntent = Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)

      try{
        context.startActivity(promotedIntent)
      }catch(e: ActivityNotFoundException){
        context.startActivity(fallbackIntent)
      }
    }
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return

    val channel = NotificationChannel(
      CHANNEL_ID,
      "Aktív edzés",
      NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
      description = "Az éppen futó edzés ideje és adatai"
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setSound(null,null)
      setShowBadge(false)
      enableVibration(false)
    }
    manager.createNotificationChannel(channel)
    manager.deleteNotificationChannel("workout_live")
  }

  @SuppressLint("MissingPermission")
  private fun showNotification(data: WorkoutNotificationData) {
    ensureChannel()
    val manager = NotificationManagerCompat.from(context)
    if (!data.keepAlive && !manager.areNotificationsEnabled()) return

    val accent = try {
      Color.parseColor(data.accentColor)
    } catch (e: IllegalArgumentException) {
      Color.parseColor("#FC4C02")
    }

    val action = if (data.isPaused) WorkoutActionReceiver.ACTION_RESUME else WorkoutActionReceiver.ACTION_PAUSE
    val actionPending = PendingIntent.getBroadcast(
      context,
      1,
      Intent(context, WorkoutActionReceiver::class.java).setAction(action),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val openPending = context.packageManager.getLaunchIntentForPackage(context.packageName)?.let {
      PendingIntent.getActivity(
        context, 2, it,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }

    val builder = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_workout_notification)
      .setContentTitle(data.title)
      .setContentText(data.text)
      .setStyle(NotificationCompat.BigTextStyle().bigText(data.text))
      .setColor(accent)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_WORKOUT)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setContentIntent(openPending)
      .setRequestPromotedOngoing(true)
      .addAction(
        if (data.isPaused) android.R.drawable.ic_media_play else android.R.drawable.ic_media_pause,
        if (data.isPaused) "Folytatás" else "Szünet",
        actionPending
      )

    if (data.isPaused) {
      builder.setUsesChronometer(false).setShowWhen(false)
    } else {
      builder.setUsesChronometer(true)
        .setShowWhen(true)
        .setWhen(data.chronometerBaseMs.toLong())
    }

    data.chipText?.let { builder.setShortCriticalText(it) }

    val notification = builder.build()

    if (data.keepAlive && !WorkoutTrackingService.isRunning) {
      val intent = Intent(context, WorkoutTrackingService::class.java)
        .putExtra(WorkoutTrackingService.EXTRA_NOTIFICATION, notification)
      try {
        ContextCompat.startForegroundService(context, intent)
        return
      } catch (e: Exception) {
        // pl. hatterbol nem indithato: sima ertesites marad
      }
    }

    try {
      manager.notify(NOTIFICATION_ID, notification)
    } catch (e: SecurityException) {
      // nincs ertesitesi engedely
    }
  }
}