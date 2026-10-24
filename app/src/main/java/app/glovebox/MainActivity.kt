package app.glovebox

import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import kotlinx.coroutines.launch
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import java.util.Locale

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private lateinit var webView: WebView
    private lateinit var addressBar: LinearLayout
    private lateinit var urlInput: EditText
    private lateinit var drivingBar: LinearLayout
    private lateinit var statusBadge: TextView

    private lateinit var pinStore: PinStore
    private var tts: TextToSpeech? = null
    private var ttsReady = false

    private val homeUrl = "https://duckduckgo.com/"

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
            if (grants[Manifest.permission.ACCESS_FINE_LOCATION] == true) {
                DriveService.start(this)
            }
        }

    private val voiceLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val spoken = result.data
                    ?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
                    ?.firstOrNull()
                if (!spoken.isNullOrBlank()) loadInput(spoken)
            }
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webView)
        addressBar = findViewById(R.id.addressBar)
        urlInput = findViewById(R.id.urlInput)
        drivingBar = findViewById(R.id.drivingBar)
        statusBadge = findViewById(R.id.statusBadge)

        configureWebView()
        configureControls()
        goFullscreen()

        pinStore = PinStore(this)
        tts = TextToSpeech(this, this)

        // Drive state comes from the foreground service, so it keeps updating
        // while another app (for example navigation) is in front.
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                DriveService.driving.collect { applyMode(it) }
            }
        }

        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED
        ) {
            DriveService.start(this)
        } else {
            permissionLauncher.launch(
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.RECORD_AUDIO,
                    Manifest.permission.POST_NOTIFICATIONS
                )
            )
        }

        applyMode(false)
        val incoming = intent?.dataString
        loadInput(incoming ?: savedInstanceState?.getString(KEY_URL) ?: homeUrl)
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.dataString?.let { loadInput(it) }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(KEY_URL, webView.url ?: homeUrl)
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        // Pausing the WebView stops background media, the first line of video lock.
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        // The DriveService keeps running on purpose; only the UI goes away here.
        tts?.stop()
        tts?.shutdown()
        webView.destroy()
        super.onDestroy()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack()
            return true
        }
        return super.onKeyDown(keyCode, event)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts?.language = Locale.getDefault()
            ttsReady = true
        }
    }

    // --- Setup ----------------------------------------------------------------

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            // Media must be started by a user tap, never by a page.
            mediaPlaybackRequiresUserGesture = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                // Keep everything inside Glovebox; hand off only non-web schemes.
                val scheme = request.url.scheme ?: return false
                return if (scheme == "http" || scheme == "https") false else {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, request.url))
                    } catch (_: Exception) {
                    }
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String?) {
                urlInput.setText(url ?: "")
                if (DriveService.driving.value) pauseVideosWhileDriving()
            }
        }
        webView.webChromeClient = WebChromeClient()
    }

    private fun configureControls() {
        urlInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE) {
                loadInput(urlInput.text.toString())
                true
            } else false
        }

        findViewById<Button>(R.id.btnVoice).setOnClickListener { startVoiceSearch() }
        findViewById<Button>(R.id.btnBackParked).setOnClickListener { goBackSafely() }
        findViewById<Button>(R.id.btnHome).setOnClickListener { loadInput(homeUrl) }

        findViewById<Button>(R.id.btnBackDriving).setOnClickListener { goBackSafely() }
        findViewById<Button>(R.id.btnReadAloud).setOnClickListener { readPageAloud() }
        findViewById<Button>(R.id.btnVoiceDriving).setOnClickListener { startVoiceSearch() }
        findViewById<Button>(R.id.btnStopReading).setOnClickListener { tts?.stop() }
        findViewById<Button>(R.id.btnPins).setOnClickListener { showPins() }
    }

    /** Lists saved road pins; choosing one loads it, or pins the current page. */
    private fun showPins() {
        val pins = pinStore.all()
        val canAdd = pins.size < PinStore.MAX
        val labels = pins.map { it.title } + if (canAdd) listOf(getString(R.string.pin_this_page)) else emptyList()

        if (labels.isEmpty()) {
            Toast.makeText(this, R.string.pins_empty, Toast.LENGTH_LONG).show()
            return
        }
        AlertDialog.Builder(this)
            .setTitle(R.string.pins_title)
            .setItems(labels.toTypedArray()) { _, which ->
                if (which < pins.size) {
                    loadInput(pins[which].url)
                } else {
                    pinCurrentPage()
                }
            }
            .setNegativeButton(android.R.string.cancel, null)
            .show()
    }

    private fun pinCurrentPage() {
        val url = webView.url
        if (url.isNullOrBlank()) return
        val title = webView.title?.takeIf { it.isNotBlank() } ?: url
        val added = pinStore.add(PinStore.Pin(title.take(40), url))
        val msg = if (added) title.take(40) else getString(R.string.pins_full)
        Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
    }

    // --- Actions --------------------------------------------------------------

    private fun loadInput(raw: String) {
        val text = raw.trim()
        if (text.isEmpty()) return
        val url = when {
            text.startsWith("http://") || text.startsWith("https://") -> text
            text.contains('.') && !text.contains(' ') -> "https://$text"
            else -> "https://duckduckgo.com/?q=" + Uri.encode(text)
        }
        webView.loadUrl(url)
    }

    private fun goBackSafely() {
        if (webView.canGoBack()) webView.goBack() else loadInput(homeUrl)
    }

    private fun startVoiceSearch() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.voice_prompt))
        }
        try {
            voiceLauncher.launch(intent)
        } catch (_: Exception) {
            statusBadge.text = getString(R.string.voice_unavailable)
        }
    }

    /** Reads the main visible text aloud, trimmed so a long article does not drone on. */
    private fun readPageAloud() {
        if (!ttsReady) return
        val script = "(function(){var m=document.querySelector('article,main')||document.body;" +
            "return (m && m.innerText) ? m.innerText.slice(0,1500) : '';})()"
        webView.evaluateJavascript(script) { raw ->
            val text = raw?.trim('"')?.replace("\\n", " ").orEmpty()
            if (text.isNotBlank()) tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "page")
        }
    }

    /**
     * Video lock: while driving, pause every <video> and <audio> element on the page
     * and keep them paused. This is the opposite of sideloaded browsers that bypass
     * Android Auto's video lock.
     */
    private fun pauseVideosWhileDriving() {
        val script = "(function(){document.querySelectorAll('video,audio').forEach(function(m){" +
            "try{m.pause();}catch(e){}});})()"
        webView.evaluateJavascript(script, null)
    }

    // --- Mode switching -------------------------------------------------------

    private fun applyMode(driving: Boolean) {
        runOnUiThread {
            // Driving: no address bar, large controls only.
            addressBar.visibility = if (driving) View.GONE else View.VISIBLE
            drivingBar.visibility = if (driving) View.VISIBLE else View.GONE
            statusBadge.text = getString(
                if (driving) R.string.badge_driving else R.string.badge_parked
            )
            if (driving) {
                pauseVideosWhileDriving()
                tts?.stop()
            }
        }
    }

    private fun goFullscreen() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsetsCompat.Type.systemBars())
        if (Build.VERSION.SDK_INT >= 28) {
            window.attributes.layoutInDisplayCutoutMode =
                android.view.WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
    }

    companion object {
        private const val KEY_URL = "last_url"
    }
}
