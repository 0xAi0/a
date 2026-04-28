package com.marketpulse.android

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ListView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class OpenLogActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_open_log)

        val countLabel = findViewById<TextView>(R.id.openCountLabel)
        val listView = findViewById<ListView>(R.id.logList)

        val count = AppStorage.getOpenCount(this)
        val logs = AppStorage.getOpenLogs(this)

        countLabel.text = "App opened $count times"
        listView.adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, logs)
    }
}
