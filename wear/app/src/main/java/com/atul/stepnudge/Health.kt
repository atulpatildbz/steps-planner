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
        val stop = watchCounter(c)
        HealthServices.getClient(c).passiveMonitoringClient.flushAsync()
        handler.postDelayed({ stop(); then() }, delayMs)
    }

    /** Feeds every step-sensor reading into the store until the returned stop is called. */
    fun watchCounter(c: Context): () -> Unit {
        if (!hasPermission(c)) return {}
        val sm = c.getSystemService(SensorManager::class.java)
        val sensor = sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) ?: return {}
        val listener = object : SensorEventListener {
            override fun onSensorChanged(e: SensorEvent) =
                Store.syncCounter(c, e.values[0].toLong(), e.timestamp / 1_000_000)
            override fun onAccuracyChanged(s: Sensor?, a: Int) = Unit
        }
        sm.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL, 2_000_000)
        sm.flush(listener) // hand over the current count straight away
        return { sm.unregisterListener(listener) }
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
