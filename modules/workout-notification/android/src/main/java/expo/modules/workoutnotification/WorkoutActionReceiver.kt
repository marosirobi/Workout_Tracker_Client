package expo.modules.workoutnotification

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class WorkoutActionReceiver : BroadcastReceiver() {
    companion object {
         const val ACTION_PAUSE = "expo.modules.workoutnotification.PAUSE"
        const val ACTION_RESUME = "expo.modules.workoutnotification.RESUME"
    }
    override fun onReceive(context: Context, intent: Intent){
        when(intent.action){
            ACTION_PAUSE -> WorkoutNotificationModule.emitAction("pause")
            ACTION_RESUME -> WorkoutNotificationModule.emitAction("resume")
        }
    }
}