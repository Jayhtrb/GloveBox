package app.glovebox

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.Looper

/**
 * Feeds GPS speed into [DriveState] and reports driving/parked changes.
 * The state logic lives in [DriveState]; this class only handles Android location.
 */
class DriveModeMonitor(
    context: Context,
    private val onChanged: (driving: Boolean) -> Unit
) {
    companion object {
        private const val MIN_UPDATE_MS = 1_000L
    }

    private val locationManager =
        context.applicationContext.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    private val state = DriveState()
    private var active = false

    val isDriving: Boolean get() = state.isDriving

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
            active = false // no permission: stay parked
        } catch (_: IllegalArgumentException) {
            active = false // no GPS provider on this device
        }
    }

    fun stop() {
        if (!active) return
        active = false
        locationManager.removeUpdates(listener)
    }

    /** Also used by the manual "I'm the passenger" toggle path. */
    fun onSpeed(speedMps: Float, timestampMs: Long = System.currentTimeMillis()) {
        state.update(speedMps, timestampMs)?.let { onChanged(it) }
    }
}
