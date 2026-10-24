package app.glovebox

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class DriveStateTest {

    @Test
    fun startsParked() {
        assertFalse(DriveState().isDriving)
    }

    @Test
    fun entersDrivingImmediatelyAtThreshold() {
        val s = DriveState()
        assertEquals(true, s.update(DriveState.DEFAULT_ENTER_MPS, 0L))
        assertTrue(s.isDriving)
    }

    @Test
    fun slowSpeedDoesNotEnterDriving() {
        val s = DriveState()
        assertNull(s.update(3.0f, 0L))
        assertFalse(s.isDriving)
    }

    @Test
    fun stopBelowExitSpeedRequiresFullDelay() {
        val s = DriveState()
        s.update(10f, 0L)
        assertNull(s.update(0f, 1_000L))           // starts the timer
        assertNull(s.update(0f, 20_000L))          // 19s elapsed, still driving
        assertEquals(false, s.update(0f, 31_000L)) // 30s elapsed, exits
        assertFalse(s.isDriving)
    }

    @Test
    fun briefStopAtRedLightKeepsDrivingMode() {
        val s = DriveState()
        s.update(10f, 0L)
        s.update(0f, 1_000L)                       // stop begins
        assertNull(s.update(8f, 10_000L))          // moving again cancels the exit
        assertNull(s.update(0f, 20_000L))          // new stop, timer restarts here
        assertNull(s.update(0f, 45_000L))          // only 25s since restart
        assertTrue(s.isDriving)
    }

    @Test
    fun speedBetweenThresholdsCancelsPendingExit() {
        val s = DriveState()
        s.update(10f, 0L)
        s.update(0f, 1_000L)
        assertNull(s.update(3f, 15_000L))          // 3 m/s is above exit threshold
        assertNull(s.update(0f, 20_000L))
        assertNull(s.update(0f, 40_000L))          // 20s since restart, not 39s
        assertTrue(s.isDriving)
    }

    @Test
    fun rejectsExitAboveEnter() {
        try {
            DriveState(enterSpeedMps = 2f, exitSpeedMps = 3f)
            throw AssertionError("expected IllegalArgumentException")
        } catch (_: IllegalArgumentException) {
        }
    }
}
