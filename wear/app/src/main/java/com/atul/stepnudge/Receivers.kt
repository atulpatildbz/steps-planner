package com.atul.stepnudge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat

class AlarmReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val c = context.applicationContext
        if (intent.action == ACTION_MUTE) {
            Store.setMuted(c, true)
            NotificationManagerCompat.from(c).cancelAll()
            return
        }
        // Pull in any batched steps first, so we don't nudge someone who's already walking.
        val pending = goAsync()
        Health.flushThen(c, 3_000) {
            Nudger.evaluate(c)
            pending.finish()
        }
    }

    companion object {
        const val ACTION_MUTE = "com.atul.stepnudge.MUTE"
    }
}

/** Alarms don't survive a reboot or app update; re-arm them. */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        Health.register(context)
        Nudger.evaluate(context)
    }
}
