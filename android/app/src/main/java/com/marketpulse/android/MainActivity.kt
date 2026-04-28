package com.marketpulse.android

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.EditText
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.Toolbar
import androidx.core.content.ContextCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        AppStorage.recordAppOpen(this)
        maybeRequestNotificationPermission()

        val toolbar = findViewById<Toolbar>(R.id.toolbar)
        toolbar.inflateMenu(R.menu.main_menu)
        toolbar.setOnMenuItemClickListener {
            when (it.itemId) {
                R.id.action_set_alert -> {
                    openAlertDialog()
                    true
                }

                R.id.action_view_open_logs -> {
                    startActivity(Intent(this, OpenLogActivity::class.java))
                    true
                }

                else -> false
            }
        }

        webView = findViewById(R.id.webView)
        webView.settings.javaScriptEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.setSupportZoom(false)
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                return false
            }
        }

        webView.loadUrl("file:///android_asset/web/index.html")
        schedulePriceWorker()
    }

    private fun schedulePriceWorker() {
        val work = PeriodicWorkRequestBuilder<PriceAlertWorker>(15, TimeUnit.MINUTES)
            .build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "price-alert-check",
            ExistingPeriodicWorkPolicy.UPDATE,
            work,
        )
    }

    private fun openAlertDialog() {
        val dialogView = layoutInflater.inflate(R.layout.dialog_set_alert, null)
        val symbolInput = dialogView.findViewById<EditText>(R.id.alertSymbolInput)
        val priceInput = dialogView.findViewById<EditText>(R.id.alertPriceInput)

        val existing = AppStorage.getAlertConfig(this)
        if (existing != null) {
            symbolInput.setText(existing.symbol)
            priceInput.setText(existing.targetPrice.toString())
        }

        val directions = arrayOf("Above target", "Below target")
        var selectedIndex = if (existing?.direction == AlertDirection.BELOW) 1 else 0

        AlertDialog.Builder(this)
            .setTitle("Set Price Alert (Binance)")
            .setView(dialogView)
            .setSingleChoiceItems(directions, selectedIndex) { _, which ->
                selectedIndex = which
            }
            .setPositiveButton("Save") { _, _ ->
                val symbol = symbolInput.text.toString().trim().uppercase()
                val price = priceInput.text.toString().trim().toDoubleOrNull()
                if (symbol.isNotBlank() && price != null && price > 0) {
                    val direction = if (selectedIndex == 0) AlertDirection.ABOVE else AlertDirection.BELOW
                    AppStorage.saveAlertConfig(this, AlertConfig(symbol, price, direction))
                }
            }
            .setNeutralButton("Disable") { _, _ ->
                AppStorage.saveAlertConfig(this, null)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun maybeRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return

        val granted = ContextCompat.checkSelfPermission(
            this,
            Manifest.permission.POST_NOTIFICATIONS,
        ) == PackageManager.PERMISSION_GRANTED

        if (!granted) {
            notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
}
