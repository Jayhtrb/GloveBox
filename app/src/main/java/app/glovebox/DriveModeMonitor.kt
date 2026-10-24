package app.glovebox

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper

/**
 * Decides whether the car is moving, using GPS speed.
 *
 * Hysteresis keeps the UI from flickering at a red light:
 *  - Enter Drive Mode when speed >= [ENTER_SPEED_MPS] (about 18 km/h).
 *  - Leave Drive Mode only after speed has stayed below [EXIT_SPEED_MPS]
 *    for [EXIT_DELAY_MS] (30 s), so a short stop does not switch layouts.
 */
class DriveModeMonitor(
    context: Context,
    private val onChanged: (driving: Boolean) -> Unit
) {
    companion object {
        const val ENTER_SPEED_MPS = 5.0f
        const val EXIT_SPEED_MPS = 2.0f
        const val EXIT_DELAY_MS = 30_000L
        private const val MIN_UPDATE_MS = 1_000L
    }

    private val appContext = context.applicationContext
    private val locationManager =
        appContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    private val handler = Handler(Looper.getMainLooper())

    var isDriving: Boolean = false
        private set

    private var slowSince: Long? = null
    private var active = false

    private val exitRunnable = Runnable {
        if (isDriving) setDriving(false)
    }

    private val listener = object : LocationListener {
        override fun onLocationChanged(location: Location) {
            onSpeed(location.speed, location.time)
        }

        @Deprecated("Deprecated in API 29; kept for older devices")
        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    }

    @SuppressLint("MissingPermission")
    fun start() {
        if (active) return
        active = true
        try {
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                MIN_UPDATE_MS,
                0f,
                listener,
                Looper.getMainLooper()
            )
        } catch (_: SecurityException) {
            // Location permission not granted: stay in parked mode.
            active = false
        } catch (_: IllegalArgumentException) {
            // GPS provider missing on this device.
            active = false
        }
    }

    fun stop() {
        if (!active) return
        active = false
        locationManager.removeUpdates(listener)
        handler.removeCallbacks(exitRunnable)
    }

    /** Exposed for testing and for the manual "I'm the passenger" toggle. */
    fun onSpeed(speedMps: Float, timestampMs: Long = System.currentTimeMillis()) {
        when {
            speedMps >= ENTER_SPEED_MPS -> {
                slowSince = null
                handler.removeCallbacks(exitRunnable)
                if (!isDriving) setDriving(true)
            }
            speedMps < EXIT_SPEED_MPS && isDriving -> {
                if (slowSince == null) {
                    slowSince = timestampMs
                    handler.postDelayed(exitRunnable, EXIT_DELAY_MS)
                }
            }
        }
    }

    private fun setDriving(driving: Boolean) {
        isDriving = driving
        if (!driving) slowSince = null
        onChanged(driving)
    }
}
