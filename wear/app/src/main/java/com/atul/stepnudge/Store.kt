package com.atul.stepnudge

import android.content.Context
import android.content.SharedPreferences
import android.os.SystemClock
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId

/** Today's plan. The ideal line runs from (anchorTime, anchorSteps) to (endTime, target) and never moves. */
data class Plan(
    val anchorTime: Long,
    val anchorSteps: Long,
    val target: Long,
    val endTime: Long,
    val pace: Int, // steps per minute of walking
)

/** Defaults remembered for tomorrow's setup screen. */
data class Defaults(val target: Long, val endMinuteOfDay: Int, val pace: Int)

/** Per-day nudge bookkeeping, so each threshold only buzzes once. */
data class NudgeState(
    val lastLevel: Int,
    val muted: Boolean,
    val goalSent: Boolean,
    val unreachableSent: Boolean,
)

/** Everything lives in SharedPreferences, keyed to today's date so it all resets at midnight. */
object Store {
    private fun prefs(c: Context) = c.getSharedPreferences("nudge", Context.MODE_PRIVATE)

    /** Calls [block] whenever anything is saved (e.g. a new step batch); returns the unsubscribe. */
    fun onChange(c: Context, block: () -> Unit): () -> Unit {
        val l = SharedPreferences.OnSharedPreferenceChangeListener { _, _ -> block() }
        prefs(c).registerOnSharedPreferenceChangeListener(l)
        return { prefs(c).unregisterOnSharedPreferenceChangeListener(l) }
    }
    private fun today() = LocalDate.now().toString()

    /** Today's count is whatever the latest reading says; a reading can correct an earlier one downwards. */
    fun saveSteps(c: Context, steps: Long) {
        prefs(c).edit()
            .putLong("steps", steps)
            .putLong("stepsAt", System.currentTimeMillis())
            .putString("stepsDate", today())
            .putString("log", appendLog(log(c), LocalTime.now().toSecondOfDay() / 60, steps))
            .apply()
    }

    /**
     * A batch from Health Services: the same count the watch face shows, as of [endMs] (ms since boot).
     * Batches arrive late, so one can land after midnight still carrying yesterday's total; we drop those,
     * and any batch older than one we already have.
     */
    fun saveBatch(c: Context, steps: Long, endMs: Long) {
        val p = prefs(c)
        val day = Instant.ofEpochMilli(bootedAt() + endMs).atZone(ZoneId.systemDefault()).toLocalDate().toString()
        if (day != today()) return
        if (batchToday(c) != null && p.getLong("batchBoot", 0).sameBoot() && endMs < p.getLong("batchEnd", 0)) return
        p.edit()
            .putLong("batchSteps", steps)
            .putLong("batchEnd", endMs)
            .putLong("batchBoot", bootedAt())
            .putString("batchDate", today())
            .apply()
        saveSteps(c, steps)
        // The sensor may have been read just before this batch landed; see if they now line up.
        if (p.getLong("counterBoot", 0).sameBoot()) {
            syncCounter(c, p.getLong("counter", 0), p.getLong("counterAt", 0), p.getLong("counterReadAt", 0))
        }
    }

    /** Today's latest Health Services count, or null if none has arrived since midnight. */
    private fun batchToday(c: Context): Long? =
        prefs(c).takeIf { it.getString("batchDate", null) == today() }?.getLong("batchSteps", 0)

    /**
     * Health Services hands steps over in batches, so its count can lag the watch face by minutes.
     * The raw step counter (steps since boot) is always live. Its last step was at [counterAt] and none
     * came before we read it at [readAt] (both ms since boot), so a batch ending in that window counts
     * exactly the same steps: we pair the two, and between batches add the counter's steps since then.
     */
    fun syncCounter(c: Context, counter: Long, counterAt: Long, readAt: Long = SystemClock.elapsedRealtime()) {
        val p = prefs(c)
        p.edit()
            .putLong("counter", counter)
            .putLong("counterAt", counterAt)
            .putLong("counterReadAt", readAt)
            .putLong("counterBoot", bootedAt())
            .apply()
        val batchHasLatestStep = p.getString("batchDate", null) == today() && p.getLong("batchBoot", 0).sameBoot() &&
            p.getLong("batchEnd", 0) in (counterAt - 1_000)..(readAt + 1_000)
        if (batchHasLatestStep) {
            p.edit()
                .putLong("pairedSteps", p.getLong("batchSteps", 0))
                .putLong("pairedCounter", counter)
                .putString("pairedDate", today())
                .apply()
            return saveSteps(c, p.getLong("batchSteps", 0)) // marks the count as just checked
        }
        val pairedCounter = p.getLong("pairedCounter", -1)
        // A smaller counter means the watch rebooted since the pairing.
        if (p.getString("pairedDate", null) == today() && pairedCounter in 0..counter) {
            // Never below Health Services' own count, in case the counter reading is older than its batch.
            saveSteps(c, maxOf(p.getLong("pairedSteps", 0) + counter - pairedCounter, batchToday(c) ?: 0))
        }
    }

    private fun bootedAt() = System.currentTimeMillis() - SystemClock.elapsedRealtime()

    // Boot time wobbles by a few ms between readings, hence the tolerance.
    private fun Long.sameBoot() = kotlin.math.abs(this - bootedAt()) < 5_000

    /**
     * Today's step count over time, as "minute:steps;…", so a plan can start in the past.
     * Steps only change while walking, so the last entry before a time is the count at that time.
     */
    private fun log(c: Context): String =
        if (hasStepsToday(c)) prefs(c).getString("log", "")!! else ""

    private fun appendLog(log: String, minute: Int, steps: Long): String {
        val last = log.substringAfterLast(';').substringAfter(':').toLongOrNull()
        if (last == steps) return log
        return if (log.isEmpty()) "$minute:$steps" else "$log;$minute:$steps"
    }

    /** Steps as of [minuteOfDay] today, or 0 if nothing was logged by then. */
    fun stepsAtMinute(c: Context, minuteOfDay: Int): Long =
        log(c).split(';').filter { it.isNotEmpty() }
            .map { it.substringBefore(':').toInt() to it.substringAfter(':').toLong() }
            .lastOrNull { it.first <= minuteOfDay }?.second ?: 0

    /** Daily steps from Health Services; 0 if nothing has arrived since midnight. */
    fun todaySteps(c: Context): Long =
        if (hasStepsToday(c)) prefs(c).getLong("steps", 0) else 0

    fun stepsAt(c: Context): Long = prefs(c).getLong("stepsAt", 0)

    fun hasStepsToday(c: Context) = prefs(c).getString("stepsDate", null) == today()

    fun plan(c: Context): Plan? {
        val p = prefs(c)
        if (p.getString("planDate", null) != today()) return null
        return Plan(
            anchorTime = p.getLong("anchorTime", 0),
            anchorSteps = p.getLong("anchorSteps", 0),
            target = p.getLong("target", 0),
            endTime = p.getLong("endTime", 0),
            pace = p.getInt("pace", 100),
        )
    }

    fun startPlan(c: Context, plan: Plan, endMinuteOfDay: Int) = prefs(c).edit()
        .putString("planDate", today())
        .putLong("anchorTime", plan.anchorTime)
        .putLong("anchorSteps", plan.anchorSteps)
        .putLong("target", plan.target)
        .putLong("endTime", plan.endTime)
        .putInt("pace", plan.pace)
        .putInt("defaultEndMinute", endMinuteOfDay)
        .putInt("lastLevel", 0)
        .putBoolean("goalSent", false)
        .putBoolean("unreachableSent", false)
        .apply()

    fun clearPlan(c: Context) = prefs(c).edit().remove("planDate").apply()

    fun defaults(c: Context) = Defaults(
        target = prefs(c).getLong("target", 10_000),
        endMinuteOfDay = prefs(c).getInt("defaultEndMinute", 18 * 60),
        pace = prefs(c).getInt("pace", 100),
    )

    fun nudgeState(c: Context): NudgeState {
        val p = prefs(c)
        return NudgeState(
            lastLevel = p.getInt("lastLevel", 0),
            muted = p.getString("mutedDate", null) == today(),
            goalSent = p.getBoolean("goalSent", false),
            unreachableSent = p.getBoolean("unreachableSent", false),
        )
    }

    fun saveNudgeState(c: Context, s: NudgeState) = prefs(c).edit()
        .putInt("lastLevel", s.lastLevel)
        .putBoolean("goalSent", s.goalSent)
        .putBoolean("unreachableSent", s.unreachableSent)
        .apply()

    /** Muting lasts for the rest of today only. */
    fun setMuted(c: Context, muted: Boolean) =
        prefs(c).edit().putString("mutedDate", if (muted) today() else null).apply()
}
