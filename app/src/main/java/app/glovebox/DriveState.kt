package app.glovebox

/**
 * Pure drive/parked state machine with hysteresis. No Android types, so it can be
 * unit-tested on the JVM.
 *
 *  - Speed >= [enterSpeedMps] switches to driving immediately.
 *  - Driving ends only after speed stays below [exitSpeedMps] for [exitDelayMs].
 *    Any speed above the exit threshold cancels the pending exit.
 */
class DriveState(
    val enterSpeedMps: Float = DEFAULT_ENTER_MPS,
    val exitSpeedMps: Float = DEFAULT_EXIT_MPS,
    val exitDelayMs: Long = DEFAULT_EXIT_DELAY_MS
) {
    companion object {
        const val DEFAULT_ENTER_MPS = 5.0f
        const val DEFAULT_EXIT_MPS = 2.0f
        const val DEFAULT_EXIT_DELAY_MS = 30_000L
    }

    init {
        require(exitSpeedMps < enterSpeedMps) { "exit speed must be below enter speed" }
    }

    var isDriving: Boolean = false
        private set

    private var slowSince: Long? = null

    /**
     * Feed one speed sample. Returns the new driving value if it changed, or null.
     * [nowMs] is the sample time; it drives the exit delay.
     */
    fun update(speedMps: Float, nowMs: Long): Boolean? {
        if (speedMps >= enterSpeedMps) {
            slowSince = null
            return if (!isDriving) set(true) else null
        }
        if (!isDriving) return null
        if (speedMps >= exitSpeedMps) {
            // Between thresholds or fast: cancel any pending exit.
            slowSince = null
            return null
        }
        val since = slowSince ?: nowMs.also { slowSince = it }
        return if (nowMs - since >= exitDelayMs) set(false) else null
    }

    private fun set(driving: Boolean): Boolean {
        isDriving = driving
        slowSince = null
        return driving
    }
}
