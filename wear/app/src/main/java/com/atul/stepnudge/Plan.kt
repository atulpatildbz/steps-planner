package com.atul.stepnudge

import kotlin.math.abs
import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.roundToLong

/** A nudge fires each time the catch-up walk grows by this many minutes. */
const val NUDGE_STEP_MIN = 5

enum class Mood { AHEAD, ON_TRACK, BEHIND, UNREACHABLE, DONE }

data class Status(
    val behind: Long, // negative = ahead
    val catchUpSteps: Long, // walking this many puts you back on the line when you finish
    val catchUpMin: Int,
    val level: Int, // catchUpMin / NUDGE_STEP_MIN
    val mood: Mood,
)

fun Plan.idealAt(t: Long): Long {
    val f = ((t - anchorTime).toDouble() / (endTime - anchorTime)).coerceIn(0.0, 1.0)
    return (anchorSteps + (target - anchorSteps) * f).roundToLong()
}

/** The plan's average rate, for information: steps per hour and walking minutes per hour. */
fun Plan.perHour(): Pair<Long, Int> {
    val hours = (endTime - anchorTime) / 3_600_000.0
    val steps = ((target - anchorSteps) / hours).roundToLong().coerceAtLeast(0)
    return steps to (steps / pace).toInt()
}

/**
 * The line keeps rising while you walk, so a deficit takes more than deficit / pace to close:
 * each minute of walking gains only (pace - planRate) on it. Floored so a near-impossible plan can't explode it.
 */
private fun Plan.catchUpFactor(): Double {
    val planRate = (target - anchorSteps).toDouble() / ((endTime - anchorTime) / 60_000.0)
    return (1 - planRate / pace).coerceAtLeast(0.2)
}

fun Plan.status(steps: Long, now: Long): Status {
    val ideal = idealAt(now)
    val behind = ideal - steps
    val catchUpSteps = if (behind > 0) ceil(behind / catchUpFactor()).toLong() else 0
    val catchUpMin = (catchUpSteps / pace).toInt()
    val minutesLeft = (endTime - now) / 60_000.0
    val walkNeededMin = (target - steps).toDouble() / pace
    val band = max(150L, (ideal * 0.05).roundToLong())
    val mood = when {
        steps >= target -> Mood.DONE
        // Same rule as the web app: more than 50 min of walking per remaining hour.
        walkNeededMin > minutesLeft * 50 / 60 -> Mood.UNREACHABLE
        abs(behind) <= band -> Mood.ON_TRACK
        behind > 0 -> Mood.BEHIND
        else -> Mood.AHEAD
    }
    return Status(behind, catchUpSteps, catchUpMin, catchUpMin / NUDGE_STEP_MIN, mood)
}

/** When the catch-up walk will reach [level] if no more steps are walked; null if not before the end time. */
fun Plan.timeOfLevel(steps: Long, level: Int): Long? {
    val idealNeeded = steps + ceil(level.toLong() * NUDGE_STEP_MIN * pace * catchUpFactor()).toLong()
    if (idealNeeded > target) return null
    val f = (idealNeeded - anchorSteps).toDouble() / (target - anchorSteps)
    return anchorTime + (f * (endTime - anchorTime)).roundToLong()
}
