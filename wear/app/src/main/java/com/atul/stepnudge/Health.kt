package com.atul.stepnudge

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
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

    /** Asks the watch to deliver any steps it's still holding in its batch, then runs [then] after [delayMs]. */
    fun flushThen(c: Context, delayMs: Long, then: () -> Unit) {
        val run = Runnable { Handler(Looper.getMainLooper()).postDelayed(then, delayMs) }
        if (!hasPermission(c)) return run.run()
        HealthServices.getClient(c).passiveMonitoringClient.flushAsync()
            .addListener(run, ContextCompat.getMainExecutor(c))
    }
}

class StepListenerService : PassiveListenerService() {
    override fun onNewDataPointsReceived(dataPoints: DataPointContainer) {
        val latest = dataPoints.getData(DataType.STEPS_DAILY).maxByOrNull { it.endDurationFromBoot }
            ?: return
        Store.saveSteps(this, latest.value)
        Nudger.evaluate(this)
    }
}
