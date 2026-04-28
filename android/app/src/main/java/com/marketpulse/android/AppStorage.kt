package com.marketpulse.android

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

private const val PREFS = "market_pulse_prefs"
private const val KEY_OPEN_COUNT = "open_count"
private const val KEY_OPEN_LOGS = "open_logs"
private const val KEY_ALERT_SYMBOL = "alert_symbol"
private const val KEY_ALERT_PRICE = "alert_price"
private const val KEY_ALERT_DIRECTION = "alert_direction"
private const val KEY_ALERT_LAST_STATE = "alert_last_state"

enum class AlertDirection { ABOVE, BELOW }

data class AlertConfig(
    val symbol: String,
    val targetPrice: Double,
    val direction: AlertDirection,
)

object AppStorage {
    fun recordAppOpen(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val count = prefs.getInt(KEY_OPEN_COUNT, 0) + 1
        val logsJson = prefs.getString(KEY_OPEN_LOGS, "[]") ?: "[]"
        val array = JSONArray(logsJson)
        array.put(0, JSONObject().put("openedAt", Instant.now().toString()))

        prefs.edit()
            .putInt(KEY_OPEN_COUNT, count)
            .putString(KEY_OPEN_LOGS, array.toString())
            .apply()
    }

    fun getOpenCount(context: Context): Int {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .getInt(KEY_OPEN_COUNT, 0)
    }

    fun getOpenLogs(context: Context): List<String> {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val logsJson = prefs.getString(KEY_OPEN_LOGS, "[]") ?: "[]"
        val array = JSONArray(logsJson)
        return buildList {
            for (i in 0 until array.length()) {
                val item = array.getJSONObject(i)
                add(item.optString("openedAt", "Unknown"))
            }
        }
    }

    fun saveAlertConfig(context: Context, config: AlertConfig?) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val edit = prefs.edit()
        if (config == null) {
            edit.remove(KEY_ALERT_SYMBOL)
            edit.remove(KEY_ALERT_PRICE)
            edit.remove(KEY_ALERT_DIRECTION)
            edit.remove(KEY_ALERT_LAST_STATE)
        } else {
            edit.putString(KEY_ALERT_SYMBOL, config.symbol.uppercase())
            edit.putFloat(KEY_ALERT_PRICE, config.targetPrice.toFloat())
            edit.putString(KEY_ALERT_DIRECTION, config.direction.name)
            edit.remove(KEY_ALERT_LAST_STATE)
        }
        edit.apply()
    }

    fun getAlertConfig(context: Context): AlertConfig? {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val symbol = prefs.getString(KEY_ALERT_SYMBOL, null) ?: return null
        val price = prefs.getFloat(KEY_ALERT_PRICE, -1f).toDouble()
        val direction = prefs.getString(KEY_ALERT_DIRECTION, null) ?: return null
        if (price <= 0.0) return null

        return AlertConfig(
            symbol = symbol,
            targetPrice = price,
            direction = AlertDirection.valueOf(direction)
        )
    }

    fun getLastAlertState(context: Context): Boolean? {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        if (!prefs.contains(KEY_ALERT_LAST_STATE)) return null
        return prefs.getBoolean(KEY_ALERT_LAST_STATE, false)
    }

    fun saveLastAlertState(context: Context, reached: Boolean) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY_ALERT_LAST_STATE, reached)
            .apply()
    }
}
