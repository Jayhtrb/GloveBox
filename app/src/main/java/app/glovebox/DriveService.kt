package app.glovebox

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Foreground service that keeps GPS running while Glovebox is in the background
 * (for example while Google Maps is the foreground app). Without it, Android stops
 * location updates and Drive Mode would freeze in its last state.
 *
 * Drive state is published through [driving]; the activity collects it.
 */
class DriveService : Service() {

    companion object {
        private const val CHANNEL_ID = "glovebox_drive"
        private const val NOTIFICATION_ID = 1

        private val _driving = MutableStateFlow(false)
        val driving: StateFlow<Boolean> = _driving.asStateFlow()

        fun start(context: Context) {
            context.startForegroundService(Intent(context, DriveService::class.java))
        }
    }

    private lateinit var monitor: DriveModeMonitor

    override fun onCreate() {
        super.onCreate()
        createChannel()
        val notification = buildNotification()
        ServiceCompat.startForeground(
            this,
            NOTIFICATION_ID,
            notification,
            ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
        )
        monitor = DriveModeMonitor(this) { driving -> _driving.value = driving }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        monitor.start()
        // Restart automatically if the system kills the service.
        return START_STICKY
    }

    override fun onDestroy() {
        monitor.stop()
        _driving.value = false
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createChannel() {
        val manager = getSystemService(NotificationManager::class.java)
        if (manager.getNotificationChannel(CHANNEL_ID) == null) {
            manager.createNotificationChannel(
                NotificationChannel(
                    CHANNEL_ID,
                    getString(R.string.drive_channel_name),
                    NotificationManager.IMPORTANCE_LOW
                )
            )
        }
    }

    private fun buildNotification(): Notification =
        NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(getString(R.string.drive_channel_text))
            .setOngoing(true)
            .setSilent(true)
            .build()
}
