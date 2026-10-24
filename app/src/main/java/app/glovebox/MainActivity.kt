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
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.webkit.WebViewAssetLoader
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * Shows the GloveBox UI (bundled from web/ into assets/glovebox) as the home screen.
 * Browsing happens in a native WebView on top of it, so sites that block iframes still load.
 *
 * Drive state comes from [DriveService] and is pushed into the web UI, which then shows the
 * Drive Mode layout. While driving, browsing closes and any video is paused.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var dashboard: WebView
    private lateinit var browse: WebView
    private lateinit var browseOverlay: LinearLayout
    private lateinit var urlInput: EditText

    private val homeUrl = "https://www.google.com"

    private val assetLoader by lazy {
        WebViewAssetLoader.Builder()
            .setDomain(APP_DOMAIN)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
    }

    private val permissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { grants ->
            if (grants[Manifest.permission.ACCESS_FINE_LOCATION] == true) {
                DriveService.start(this)
            }
        }

    private val voiceLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            val spoken = if (result.resultCode == Activity.RESULT_OK) {
                result.data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)?.firstOrNull().orEmpty()
            } else ""
            // Always answer, even on cancel, so the web UI can leave its listening state.
            dashboard.evaluateJavascript(
                "window.gloveboxVoiceResult && window.gloveboxVoiceResult(${JSONObject.quote(spoken)})",
                null
            )
        }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        dashboard = findViewById(R.id.dashboard)
        browse = findViewById(R.id.browse)
        browseOverlay = findViewById(R.id.browseOverlay)
        urlInput = findViewById(R.id.urlInput)

        configureDashboard()
        configureBrowser()
        configureBrowseControls()
        goFullscreen()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                when {
                    browseOverlay.visibility == View.VISIBLE && browse.canGoBack() -> browse.goBack()
                    browseOverlay.visibility == View.VISIBLE -> closeBrowse()
                    dashboard.canGoBack() -> dashboard.goBack()
                    else -> {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            }
        })

        // Drive state comes from the foreground service, so it keeps updating while
        // navigation is in front.
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                DriveService.driving.collect { applyDriving(it) }
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

        dashboard.loadUrl(DASHBOARD_URL)
        intent?.dataString?.let { openBrowse(it) }
    }

    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        intent?.dataString?.let { openBrowse(it) }
    }

    override fun onResume() {
        super.onResume()
        dashboard.onResume()
        if (browseOverlay.visibility == View.VISIBLE) browse.onResume()
    }

    override fun onPause() {
        // Pausing the WebViews stops background media, the first line of video lock.
        dashboard.onPause()
        browse.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        // DriveService keeps running on purpose; only the UI goes away here.
        dashboard.destroy()
        browse.destroy()
        super.onDestroy()
    }

    // --- Setup ----------------------------------------------------------------

    @SuppressLint("SetJavaScriptEnabled", "JavascriptInterface")
    private fun configureDashboard() {
        dashboard.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = true
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        dashboard.addJavascriptInterface(NativeBridge(), "GloveBoxNative")
        dashboard.webChromeClient = WebChromeClient()
        dashboard.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                assetLoader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                return when (uri.scheme) {
                    "https", "http" -> {
                        if (uri.host != APP_DOMAIN) openBrowse(uri.toString())
                        true
                    }
                    else -> {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, uri))
                        } catch (_: Exception) {
                        }
                        true
                    }
                }
            }

            override fun onPageFinished(view: WebView, url: String?) {
                // Tell the freshly loaded page the current drive state.
                pushDrivingToWeb(DriveService.driving.value)
            }
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureBrowser() {
        browse.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            // Media must be started by a tap, never by a page.
            mediaPlaybackRequiresUserGesture = true
            loadWithOverviewMode = true
            useWideViewPort = true
            builtInZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        browse.webChromeClient = WebChromeClient()
        browse.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val uri = request.url
                return if (uri.scheme == "http" || uri.scheme == "https") false else {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, uri))
                    } catch (_: Exception) {
                    }
                    true
                }
            }

            override fun onPageFinished(view: WebView, url: String?) {
                urlInput.setText(url ?: "")
                if (DriveService.driving.value) pauseVideos(browse)
            }
        }
    }

    private fun configureBrowseControls() {
        urlInput.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_GO || actionId == EditorInfo.IME_ACTION_DONE) {
                loadInBrowse(urlInput.text.toString())
                true
            } else false
        }
        findViewById<Button>(R.id.btnBrowseBack).setOnClickListener {
            if (browse.canGoBack()) browse.goBack()
        }
        findViewById<Button>(R.id.btnBrowseForward).setOnClickListener {
            if (browse.canGoForward()) browse.goForward()
        }
        findViewById<Button>(R.id.btnBrowseReload).setOnClickListener { browse.reload() }
        findViewById<Button>(R.id.btnBrowseHome).setOnClickListener { loadInBrowse(homeUrl) }
        findViewById<Button>(R.id.btnCloseBrowse).setOnClickListener { closeBrowse() }
    }

    /** Methods the web UI calls. These run on a background thread, so they hop to the UI thread. */
    inner class NativeBridge {
        @JavascriptInterface
        fun openUrl(url: String) = runOnUiThread { openBrowse(url) }

        @JavascriptInterface
        fun showBrowser(url: String) = runOnUiThread { openBrowse(url.ifBlank { homeUrl }) }

        @JavascriptInterface
        fun startVoice() = runOnUiThread { startVoiceSearch() }
    }

    // --- Browsing -------------------------------------------------------------

    private fun openBrowse(raw: String) = runOnUiThread {
        if (DriveService.driving.value) {
            Toast.makeText(this, R.string.browse_locked, Toast.LENGTH_SHORT).show()
            return@runOnUiThread
        }
        browseOverlay.visibility = View.VISIBLE
        browse.onResume()
        loadInBrowse(raw)
    }

    private fun loadInBrowse(raw: String) {
        val text = raw.trim()
        if (text.isEmpty()) return
        val url = when {
            text.startsWith("http://") || text.startsWith("https://") -> text
            text.contains('.') && !text.contains(' ') -> "https://$text"
            else -> "https://www.google.com/search?q=" + Uri.encode(text)
        }
        browse.loadUrl(url)
    }

    private fun closeBrowse() {
        pauseVideos(browse)
        browse.onPause()
        browseOverlay.visibility = View.GONE
    }

    private fun startVoiceSearch() {
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.voice_prompt))
        }
        try {
            voiceLauncher.launch(intent)
        } catch (_: Exception) {
            Toast.makeText(this, R.string.voice_unavailable, Toast.LENGTH_SHORT).show()
            dashboard.evaluateJavascript("window.gloveboxVoiceResult && window.gloveboxVoiceResult('')", null)
        }
    }

    /**
     * Video lock: pause every <video> and <audio> element and keep them paused while driving.
     * This is the opposite of sideloaded browsers that bypass Android Auto's video lock.
     */
    private fun pauseVideos(view: WebView) {
        val script = "(function(){document.querySelectorAll('video,audio').forEach(function(m){" +
            "try{m.pause();}catch(e){}});})()"
        view.evaluateJavascript(script, null)
    }

    // --- Mode switching -------------------------------------------------------

    private fun applyDriving(driving: Boolean) {
        pushDrivingToWeb(driving)
        if (driving && browseOverlay.visibility == View.VISIBLE) {
            // Browsing is locked while driving, so close it rather than leave a video open.
            closeBrowse()
            Toast.makeText(this, R.string.browse_locked, Toast.LENGTH_SHORT).show()
        }
    }

    private fun pushDrivingToWeb(driving: Boolean) {
        dashboard.evaluateJavascript(
            "window.gloveboxSetDriving && window.gloveboxSetDriving($driving)",
            null
        )
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
        private const val APP_DOMAIN = "appassets.androidplatform.net"
        private const val DASHBOARD_URL = "https://$APP_DOMAIN/assets/glovebox/index.html#/home"
    }
}
