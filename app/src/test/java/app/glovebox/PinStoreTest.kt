package app.glovebox

import app.glovebox.PinStore.Pin
import org.junit.Assert.assertEquals
import org.junit.Test

class PinStoreTest {

    @Test
    fun roundTripsPins() {
        val pins = listOf(Pin("News", "https://example.com/news"), Pin("Maps", "https://maps.example"))
        assertEquals(pins, PinStore.parse(PinStore.serialize(pins)))
    }

    @Test
    fun skipsMalformedLines() {
        val raw = "good|https://a.example\nno-separator\n|https://empty-title\ntitle-only|\n"
        assertEquals(listOf(Pin("good", "https://a.example")), PinStore.parse(raw))
    }

    @Test
    fun capsAtMax() {
        val many = (1..10).map { Pin("p$it", "https://x.example/$it") }
        assertEquals(PinStore.MAX, PinStore.parse(PinStore.serialize(many)).size)
    }

    @Test
    fun titleSeparatorIsSanitised() {
        val s = PinStore.serialize(listOf(Pin("a|b", "https://c.example")))
        assertEquals(listOf(Pin("a b", "https://c.example")), PinStore.parse(s))
    }

    @Test
    fun nullOrBlankIsEmpty() {
        assertEquals(emptyList<Pin>(), PinStore.parse(null))
        assertEquals(emptyList<Pin>(), PinStore.parse("   "))
    }
}
