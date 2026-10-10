package com.atul.stepnudge

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Handler
import android.os.Looper
import androidx.core.content.ContextCompat
import androidx.health.services.client.HealthServices
import androidx.health.services.client.PassiveListenerService
import androidx.health.services.client.data.DataPointContainer
import androidx.health.services.client.data.DataType
import androidx.health.services.client.data.PassiveListenerConfig

/** Background step tracking via Wear OS Health Services; the watch batches updates every few minutes. */
object Health {
    fun hasPermission(c: Context) = ContextCompat.checkSelfPermission(
        c, Manifest.permission.ACTIVITY_RECOGNITION,
    ) == PackageManager.PERMISSION_GRANTED

    fun register(c: Context) {
        if (!hasPermission(c)) return
        val config = PassiveListenerConfig.builder().setDataTypes(setOf(DataType.STEPS_DAILY)).build()
        HealthServices.getClient(c).passiveMonitoringClient
            .setPassiveListenerServiceAsync(StepListenerService::class.java, config)
    }

    /**
     * Brings today's steps up to date, then runs [then] after [delayMs].
     * Asks Health Services for any steps it's still holding in its batch, and meanwhile reads the raw
     * step sensor, which is live like the watch face; see [Store.syncCounter].
     */
    fun flushThen(c: Context, delayMs: Long, then: () -> Unit) {
        val handler = Handler(Looper.getMainLooper())
        if (!hasPermission(c)) {
            handler.postDelayed(then, delayMs)
            return
        }
        val sm = c.getSystemService(SensorManager::class.java)
        var counter = -1L
        var counterAt = 0L // when the counter last moved, in ms since boot
        val listener = object : SensorEventListener {
            override fun onSensorChanged(e: SensorEvent) {
                counter = e.values[0].toLong()
                counterAt = e.timestamp / 1_000_000
            }
            override fun onAccuracyChanged(s: Sensor?, a: Int) = Unit
        }
        sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)?.let {
            sm.registerListener(listener, it, SensorManager.SENSOR_DELAY_NORMAL, 0)
            sm.flush(listener)
        }
        HealthServices.getClient(c).passiveMonitoringClient.flushAsync()
        handler.postDelayed({
            sm.unregisterListener(listener)
            if (counter >= 0) Store.syncCounter(c, counter, counterAt)
            then()
        }, delayMs)
    }
}

class StepListenerService : PassiveListenerService() {
    override fun onNewDataPointsReceived(dataPoints: DataPointContainer) {
        val latest = dataPoints.getData(DataType.STEPS_DAILY).maxByOrNull { it.endDurationFromBoot }
            ?: return
        Store.saveBatch(this, latest.value, latest.endDurationFromBoot.toMillis())
        Nudger.evaluate(this)
    }
}
