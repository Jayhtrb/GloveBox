package app.glovebox

import android.content.Context

/**
 * Up to [MAX] pinned links shown as road tiles in Drive Mode.
 * Stored in SharedPreferences as newline-separated "title|url" pairs.
 */
class PinStore(context: Context) {

    data class Pin(val title: String, val url: String)

    companion object {
        const val MAX = 5
        private const val PREFS = "glovebox_pins"
        private const val KEY = "pins"
        private const val SEP = "|"

        /** Parses stored text. Skips malformed lines. Exposed for unit tests. */
        fun parse(raw: String?): List<Pin> {
            if (raw.isNullOrBlank()) return emptyList()
            return raw.lines().mapNotNull { line ->
                val idx = line.indexOf(SEP)
                if (idx <= 0) return@mapNotNull null
                val title = line.substring(0, idx).trim()
                val url = line.substring(idx + 1).trim()
                if (title.isEmpty() || url.isEmpty()) null else Pin(title, url)
            }.take(MAX)
        }

        /** Serializes pins back to stored text. Titles lose any '|' or newlines. */
        fun serialize(pins: List<Pin>): String =
            pins.take(MAX).joinToString("\n") { p ->
                p.title.replace('\n', ' ').replace(SEP, " ") + SEP + p.url
            }
    }

    private val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    fun all(): List<Pin> = parse(prefs.getString(KEY, null))

    /** Adds a pin. Returns false if the list is full or the URL is already pinned. */
    fun add(pin: Pin): Boolean {
        val current = all()
        if (current.size >= MAX || current.any { it.url == pin.url }) return false
        prefs.edit().putString(KEY, serialize(current + pin)).apply()
        return true
    }

}
