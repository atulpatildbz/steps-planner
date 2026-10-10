package com.atul.stepnudge

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlin.math.ceil

/** A live catch-up walk: counts steps on the raw sensor until you're back on the plan line. */
object CatchUp {
    data class Progress(val walked: Int, val need: Int)

    /** Non-null while a catch-up is running; the UI watches this. */
    val state = MutableStateFlow<Progress?>(null)

    /**
     * Steps needed to be back on the line by the time you finish walking.
     * The line keeps rising while you walk, so the deficit is scaled up by 1 / (1 - planRate / pace).
     */
    fun stepsNeeded(c: Context): Int {
        val plan = Store.plan(c) ?: return 0
        val behind = plan.status(Store.todaySteps(c), System.currentTimeMillis()).behind
        if (behind <= 0) return 0
        val planRate = (plan.target - plan.anchorSteps).toDouble() / ((plan.endTime - plan.anchorTime) / 60_000.0)
        val factor = (1 - planRate / plan.pace).coerceAtLeast(0.2)
        return ceil(behind / factor).toInt()
    }

    fun start(c: Context) {
        val need = stepsNeeded(c)
        if (need <= 0 || state.value != null) return
        ContextCompat.startForegroundService(c, Intent(c, CatchUpService::class.java).putExtra("need", need))
    }

    fun stop(c: Context) {
        c.startService(Intent(c, CatchUpService::class.java).setAction(CatchUpService.ACTION_STOP))
    }
}

class CatchUpService : Service(), SensorEventListener {
    private val handler = Handler(Looper.getMainLooper())
    private var wake: PowerManager.WakeLock? = null
    private var baseline = -1f
    private var need = 0
    private var startSteps = 0L
    private var lastNotified = 0
    private var running = false

    override fun onBind(intent: Intent?) = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP) finish(done = false)
        if (intent?.action == ACTION_STOP || running) return START_NOT_STICKY
        running = true
        need = intent?.getIntExtra("need", 0) ?: 0
        startSteps = Store.todaySteps(this)
        ServiceCompat.startForeground(this, NOTIF_ID, progressNotification(need), ServiceInfo.FOREGROUND_SERVICE_TYPE_HEALTH)

        // Give up after 3x the expected walk (min 15 min) so a forgotten catch-up can't drain the battery.
        val maxMs = maxOf(15, need * 3 / (Store.plan(this)?.pace ?: 100)) * 60_000L
        // Keeps the sensor delivering with the screen off; released the moment we're done.
        wake = getSystemService(PowerManager::class.java)
            .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "stepnudge:catchup").apply { acquire(maxMs) }
        val sm = getSystemService(SensorManager::class.java)
        sm.registerListener(this, sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER), SensorManager.SENSOR_DELAY_NORMAL, 2_000_000)
        handler.postDelayed({ finish(done = false) }, maxMs)
        CatchUp.state.value = CatchUp.Progress(0, need)
        return START_NOT_STICKY
    }

    override fun onSensorChanged(e: SensorEvent) {
        if (!running) return
        if (baseline < 0) baseline = e.values[0]
        val walked = (e.values[0] - baseline).toInt()
        CatchUp.state.value = CatchUp.Progress(walked, need)
        if (walked >= need) return finish(done = true)
        if (walked - lastNotified >= 100) {
            lastNotified = walked
            NotificationManagerCompat.from(this).notify(NOTIF_ID, progressNotification(need - walked))
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) = Unit

    private fun finish(done: Boolean) {
        if (!running) return stopSelf()
        running = false
        getSystemService(SensorManager::class.java).unregisterListener(this)
        handler.removeCallbacksAndMessages(null)
        wake?.takeIf { it.isHeld }?.release()

        // Count the walk straight away rather than waiting for Health Services' next batch.
        val walked = CatchUp.state.value?.walked ?: 0
        if (walked > 0) Store.saveSteps(this, startSteps + walked)
        CatchUp.state.value = null

        ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
        stopSelf()
        if (done) Nudger.notifyCaughtUp(this)
        Nudger.evaluate(this)
    }

    private fun progressNotification(toGo: Int) = NotificationCompat.Builder(this, CHANNEL)
        .also {
            NotificationManagerCompat.from(this).createNotificationChannel(
                NotificationChannel(CHANNEL, "Catch-up walk", NotificationManager.IMPORTANCE_LOW),
            )
        }
        .setSmallIcon(R.drawable.ic_launcher_foreground)
        .setContentTitle("Catching up")
        .setContentText("${fmt(toGo.toLong())} steps to go")
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setContentIntent(PendingIntent.getActivity(this, 0, Intent(this, MainActivity::class.java), PendingIntent.FLAG_IMMUTABLE))
        .addAction(0, "Stop", PendingIntent.getService(this, 2,
            Intent(this, CatchUpService::class.java).setAction(ACTION_STOP), PendingIntent.FLAG_IMMUTABLE))
        .build()

    companion object {
        const val ACTION_STOP = "com.atul.stepnudge.STOP_CATCH_UP"
        private const val CHANNEL = "catchup"
        private const val NOTIF_ID = 2
    }
}
