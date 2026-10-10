package com.atul.stepnudge

import android.content.Context
import android.content.SharedPreferences
import java.time.LocalDate
import java.time.LocalTime

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

    /** Daily steps only go up, so a late or partial batch never makes us look behind. */
    fun saveSteps(c: Context, steps: Long) {
        val best = maxOf(steps, todaySteps(c))
        prefs(c).edit()
            .putLong("steps", best)
            .putLong("stepsAt", System.currentTimeMillis())
            .putString("stepsDate", today())
            .putString("log", appendLog(log(c), LocalTime.now().toSecondOfDay() / 60, best))
            .apply()
    }

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
