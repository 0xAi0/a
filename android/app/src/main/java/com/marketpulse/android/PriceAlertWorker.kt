package com.marketpulse.android

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

private const val CHANNEL_ID = "price_alerts"

class PriceAlertWorker(
    appContext: Context,
    params: WorkerParameters,
) : CoroutineWorker(appContext, params) {

    private val client = OkHttpClient()

    override suspend fun doWork(): Result {
        val config = AppStorage.getAlertConfig(applicationContext) ?: return Result.success()
        val endpoint = "https://api.binance.com/api/v3/ticker/price?symbol=${config.symbol}"

        return try {
            val req = Request.Builder().url(endpoint).build()
            val response = client.newCall(req).execute()
            if (!response.isSuccessful) return Result.retry()

            val body = response.body?.string() ?: return Result.retry()
            val json = JSONObject(body)
            val currentPrice = json.optString("price").toDoubleOrNull() ?: return Result.retry()

            val reached = when (config.direction) {
                AlertDirection.ABOVE -> currentPrice >= config.targetPrice
                AlertDirection.BELOW -> currentPrice <= config.targetPrice
            }

            val lastReached = AppStorage.getLastAlertState(applicationContext)
            if (reached && lastReached != true) {
                sendNotification(config, currentPrice)
            }
            AppStorage.saveLastAlertState(applicationContext, reached)
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }

    private fun sendNotification(config: AlertConfig, currentPrice: Double) {
        createNotificationChannel()

        val hasPermission = ContextCompat.checkSelfPermission(
            applicationContext,
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED

        if (!hasPermission) return

        val directionText = if (config.direction == AlertDirection.ABOVE) "rose above" else "fell below"
        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_notify_more)
            .setContentTitle("Price alert: ${config.symbol}")
            .setContentText("${config.symbol} $directionText ${config.targetPrice} (now $currentPrice)")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        NotificationManagerCompat.from(applicationContext)
            .notify(config.symbol.hashCode(), notification)
    }

    private fun createNotificationChannel() {
        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Price Alerts",
            NotificationManager.IMPORTANCE_HIGH,
        )
        manager.createNotificationChannel(channel)
    }
}
