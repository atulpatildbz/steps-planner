package com.atul.stepnudge

import android.Manifest
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import androidx.wear.compose.foundation.lazy.ScalingLazyColumn
import androidx.wear.compose.foundation.lazy.ScalingLazyListScope
import androidx.wear.compose.material.Button
import androidx.wear.compose.material.ButtonDefaults
import androidx.wear.compose.material.Chip
import androidx.wear.compose.material.ChipDefaults
import androidx.wear.compose.material.CircularProgressIndicator
import androidx.wear.compose.material.MaterialTheme
import androidx.wear.compose.material.Scaffold
import androidx.wear.compose.material.Switch
import androidx.wear.compose.material.Text
import androidx.wear.compose.material.TimeText
import androidx.wear.compose.material.ToggleChip
import androidx.wear.compose.material.ToggleChipDefaults
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MaterialTheme { App() } }
        if (intent?.action == ACTION_CATCH_UP) startCatchUp()
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        if (intent.action == ACTION_CATCH_UP) startCatchUp()
    }

    /** Pull in batched steps first so the target isn't based on a stale count. */
    fun startCatchUp() {
        Health.flushThen(this, 1_500) { CatchUp.start(this) }
    }

    companion object {
        const val ACTION_CATCH_UP = "com.atul.stepnudge.CATCH_UP"
    }
}

@Composable
private fun App() {
    val c = LocalContext.current
    // Bumped to re-read the store after any change, and periodically while the screen is open.
    var tick by remember { mutableIntStateOf(0) }
    val refresh: () -> Unit = { tick++ }

    val askPermissions = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { Health.register(c); refresh() }

    LaunchedEffect(Unit) {
        if (Health.hasPermission(c)) Health.register(c)
        else askPermissions.launch(
            arrayOf(Manifest.permission.ACTIVITY_RECOGNITION, Manifest.permission.POST_NOTIFICATIONS),
        )
    }

    // Only while on screen: pull batched steps on open and once a minute after.
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(lifecycle) {
        lifecycle.repeatOnLifecycle(Lifecycle.State.RESUMED) {
            while (true) {
                Health.flushThen(c, 2_000) { Nudger.evaluate(c); refresh() }
                delay(60_000)
            }
        }
    }

    // Setup form state lives here so each row can be its own list item.
    val d = remember { Store.defaults(c) }
    var target by remember { mutableLongStateOf(d.target) }
    var endMin by remember { mutableIntStateOf(d.endMinuteOfDay) }
    var pace by remember { mutableIntStateOf(d.pace) }
    var startMin by remember { mutableStateOf<Int?>(null) } // null = now; otherwise earlier today

    val catchUp by CatchUp.state.collectAsState()

    Scaffold(timeText = { TimeText() }) {
        @Suppress("UNUSED_EXPRESSION") tick // read so the list recomposes on refresh
        val plan = Store.plan(c)
        ScalingLazyColumn(Modifier.fillMaxWidth()) {
            val progress = catchUp
            if (progress != null) tracking(c, progress, plan?.pace ?: 100)
            else if (plan != null) active(c, plan, refresh)
            else {
                val steps = Store.todaySteps(c)
                val hasSteps = Store.hasStepsToday(c)
                val now = System.currentTimeMillis()
                val nowMin = LocalTime.now().toSecondOfDay() / 60
                val endTime = todayAt(endMin)
                val startTime = startMin?.let(::todayAt) ?: now
                // Starting earlier spreads the plan from the step count logged at that time.
                val startSteps = startMin?.let { Store.stepsAtMinute(c, it) } ?: steps
                val draft = Plan(startTime, startSteps, target, endTime, pace)
                val canStart = hasSteps && endTime > now + 15 * 60_000 && target > steps

                item {
                    Text(if (hasSteps) "${fmt(steps)} steps so far" else "Waiting for step data…",
                        style = MaterialTheme.typography.caption2)
                }
                item {
                    Stepper(
                        if (startMin == null) "Start" else "Start · from ${fmt(startSteps)}",
                        startMin?.let(::hhmm) ?: "Now",
                        { startMin = ((startMin ?: (nowMin + 29)) / 30 - 1).coerceAtLeast(0) * 30 },
                        { startMin = startMin?.let { it + 30 }?.takeIf { it < nowMin } },
                    )
                }
                item { Stepper("Target", fmt(target), { target = (target - 500).coerceAtLeast(500) }, { target += 500 }) }
                item {
                    Stepper("By", hhmm(endMin),
                        { endMin = (endMin - 30).coerceAtLeast(0) }, { endMin = (endMin + 30).coerceAtMost(23 * 60 + 30) })
                }
                item { Stepper("Pace /min", "$pace", { pace = (pace - 10).coerceAtLeast(50) }, { pace += 10 }) }
                if (canStart) item { PerHour(draft) }
                item {
                    Chip(
                        label = { Text("Start plan") },
                        onClick = {
                            Store.startPlan(c, draft, endMin)
                            Nudger.evaluate(c)
                            refresh()
                        },
                        enabled = canStart,
                        colors = ChipDefaults.primaryChipColors(),
                        modifier = Modifier.fillMaxWidth(0.85f),
                    )
                }
            }
        }
    }
}

@Composable
private fun Stepper(label: String, value: String, onMinus: () -> Unit, onPlus: () -> Unit) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        Button(onClick = onMinus, modifier = Modifier.size(ButtonDefaults.SmallButtonSize),
            colors = ButtonDefaults.secondaryButtonColors()) { Text("−") }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(label, style = MaterialTheme.typography.caption3)
            Text(value, fontSize = 18.sp, fontWeight = FontWeight.SemiBold)
        }
        Button(onClick = onPlus, modifier = Modifier.size(ButtonDefaults.SmallButtonSize),
            colors = ButtonDefaults.secondaryButtonColors()) { Text("+") }
    }
}

@Composable
private fun PerHour(plan: Plan) {
    val (steps, minutes) = plan.perHour()
    Text("≈ ${fmt(steps)} steps/hr · ~$minutes min walk/hr",
        style = MaterialTheme.typography.caption2, textAlign = TextAlign.Center)
}

private fun todayAt(minuteOfDay: Int): Long =
    LocalDate.now().atTime(LocalTime.of(minuteOfDay / 60, minuteOfDay % 60))
        .atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()

private fun hhmm(minuteOfDay: Int) = "%02d:%02d".format(minuteOfDay / 60, minuteOfDay % 60)

private fun hhmm(millis: Long) = "%tR".format(millis)

private fun ScalingLazyListScope.active(c: Context, plan: Plan, refresh: () -> Unit) {
    val now = System.currentTimeMillis()
    val steps = Store.todaySteps(c)
    val s = plan.status(steps, now)
    val muted = Store.nudgeState(c).muted
    val (headline, color) = when (s.mood) {
        Mood.DONE -> "Goal reached" to Color(0xFF34D399)
        Mood.AHEAD -> "Ahead ${fmt(-s.behind)}" to Color(0xFF34D399)
        Mood.ON_TRACK -> "On track" to Color(0xFF818CF8)
        Mood.BEHIND -> "Behind ${fmt(s.behind)}" to Color(0xFFFBBF24)
        Mood.UNREACHABLE -> "Out of reach" to Color(0xFFF87171)
    }
    val ageMin = ((now - Store.stepsAt(c)) / 60_000).coerceAtLeast(0)

    item { Text(headline, color = color, fontSize = 22.sp, fontWeight = FontWeight.Bold) }
    if (s.catchUpMin > 0 && s.mood != Mood.DONE) {
        item { Text("Walk ~${s.catchUpMin} min to catch up", textAlign = TextAlign.Center) }
    }
    item {
        Text("${fmt(steps)} / ${fmt(plan.target)} by ${hhmm(plan.endTime)}",
            style = MaterialTheme.typography.caption1)
    }
    item { PerHour(plan) }
    item { Text("updated ${ageMin} min ago", style = MaterialTheme.typography.caption3) }
    if (s.behind > 0 && s.mood != Mood.DONE) {
        item {
            Chip(
                label = { Text("Catch up") },
                onClick = { (c as MainActivity).startCatchUp() },
                colors = ChipDefaults.primaryChipColors(),
                modifier = Modifier.fillMaxWidth(0.85f),
            )
        }
    }
    controls(c, muted, refresh)
}

private fun ScalingLazyListScope.tracking(c: Context, p: CatchUp.Progress, pace: Int) {
    val toGo = (p.need - p.walked).coerceAtLeast(0)
    item { Text("Catching up", style = MaterialTheme.typography.caption1) }
    item {
        Box(Modifier.size(120.dp), contentAlignment = Alignment.Center) {
            CircularProgressIndicator(
                progress = p.walked.toFloat() / p.need,
                modifier = Modifier.fillMaxSize(),
                strokeWidth = 8.dp,
                indicatorColor = Color(0xFF818CF8),
            )
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(fmt(toGo.toLong()), fontSize = 28.sp, fontWeight = FontWeight.Bold)
                Text("steps to go", style = MaterialTheme.typography.caption3)
            }
        }
    }
    item { Text("~${(toGo + pace - 1) / pace} min", style = MaterialTheme.typography.caption1) }
    item {
        Chip(
            label = { Text("Stop") },
            onClick = { CatchUp.stop(c) },
            colors = ChipDefaults.secondaryChipColors(),
            modifier = Modifier.fillMaxWidth(0.85f),
        )
    }
}

private fun ScalingLazyListScope.controls(c: Context, muted: Boolean, refresh: () -> Unit) {
    item {
        ToggleChip(
            checked = muted,
            onCheckedChange = { Store.setMuted(c, it); refresh() },
            label = { Text("Mute today") },
            toggleControl = { Switch(checked = muted) },
            colors = ToggleChipDefaults.toggleChipColors(),
            modifier = Modifier.fillMaxWidth(0.85f),
        )
    }
    item {
        Chip(
            label = { Text("Re-plan") },
            onClick = { Store.clearPlan(c); Nudger.evaluate(c); refresh() },
            colors = ChipDefaults.secondaryChipColors(),
            modifier = Modifier.fillMaxWidth(0.85f),
        )
    }
}
