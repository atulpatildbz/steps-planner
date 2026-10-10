package com.atul.stepnudge

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import java.text.NumberFormat

/**
 * Decides whether to buzz. Runs whenever new steps arrive and whenever the alarm fires.
 *
 * Each time the catch-up walk crosses another 5-min mark (5, 10, 15…) it buzzes once.
 * Catching up lowers the mark again, so falling behind later buzzes again.
 */
object Nudger {
    private const val CHANNEL = "nudges"
    private const val NOTIF_ID = 1

    fun evaluate(c: Context) {
        val plan = Store.plan(c) ?: return cancelAlarm(c)
        val now = System.currentTimeMillis()
        val steps = Store.todaySteps(c)
        val s = plan.status(steps, now)
        var st = Store.nudgeState(c)

        if (s.mood == Mood.DONE) {
            if (!st.goalSent && !st.muted) notify(c, "Goal reached", "${fmt(steps)} steps today. Nice.")
            Store.saveNudgeState(c, st.copy(goalSent = true))
            return cancelAlarm(c)
        }
        if (now >= plan.endTime) return cancelAlarm(c)

        if (s.level > st.lastLevel && !st.muted) {
            val min = s.level * NUDGE_STEP_MIN
            notify(c, "Walk $min min", "Behind ${fmt(s.behind)} steps · ${fmt(steps)} / ${fmt(plan.target)}", catchUp = true)
        }
        st = st.copy(lastLevel = s.level)

        if (s.mood == Mood.UNREACHABLE && !st.unreachableSent) {
            if (!st.muted) notify(c, "Goal out of reach", "Re-plan with a later time or lower target, or mute today.")
            st = st.copy(unreachableSent = true)
        }
        Store.saveNudgeState(c, st)

        // Wake up exactly when sitting still would cross the next mark.
        val next = plan.timeOfLevel(steps, s.level + 1)
        if (next == null) cancelAlarm(c) else scheduleAlarm(c, maxOf(next, now + 60_000))
    }

    fun notifyCaughtUp(c: Context) = notify(c, "Caught up!", "You're back on track.")

    private fun notify(c: Context, title: String, text: String, catchUp: Boolean = false) {
        if (ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED
        ) return
        val nm = NotificationManagerCompat.from(c)
        nm.createNotificationChannel(
            NotificationChannel(CHANNEL, "Walk nudges", NotificationManager.IMPORTANCE_HIGH)
        )
        val open = PendingIntent.getActivity(
            c, 0, Intent(c, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE,
        )
        val mute = PendingIntent.getBroadcast(
            c, 1, Intent(c, AlarmReceiver::class.java).setAction(AlarmReceiver.ACTION_MUTE),
            PendingIntent.FLAG_IMMUTABLE,
        )
        val b = NotificationCompat.Builder(c, CHANNEL)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText(text)
            .setContentIntent(open)
            .setAutoCancel(true)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
        if (catchUp) {
            val start = PendingIntent.getActivity(
                c, 2, Intent(c, MainActivity::class.java).setAction(MainActivity.ACTION_CATCH_UP),
                PendingIntent.FLAG_IMMUTABLE,
            )
            b.addAction(0, "Catch up", start)
        }
        b.addAction(0, "Mute today", mute)
        nm.notify(NOTIF_ID, b.build())
    }

    private fun alarmIntent(c: Context) = PendingIntent.getBroadcast(
        c, 0, Intent(c, AlarmReceiver::class.java), PendingIntent.FLAG_IMMUTABLE,
    )

    private fun scheduleAlarm(c: Context, at: Long) =
        c.getSystemService(AlarmManager::class.java)
            .setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, alarmIntent(c))

    private fun cancelAlarm(c: Context) =
        c.getSystemService(AlarmManager::class.java).cancel(alarmIntent(c))
}

fun fmt(n: Long): String = NumberFormat.getIntegerInstance().format(n)
