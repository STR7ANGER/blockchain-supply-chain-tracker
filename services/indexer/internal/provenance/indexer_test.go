package provenance

import "testing"

func TestVerifyAndRejectTampering(t *testing.T) {
	first := Event{ID: "1", ItemID: "item", PayloadHash: "a", Kind: "ITEM_SERIALIZED", OccurredAt: "2030-01-01T00:00:00.000Z", Sequence: 1}
	first.ChainHash = ExpectedHash("", first.PayloadHash, first.Kind, first.OccurredAt)
	second := Event{ID: "2", ItemID: "item", PayloadHash: "b", PreviousHash: first.ChainHash, Kind: "SHIPPED", OccurredAt: "2030-01-02T00:00:00.000Z", Sequence: 2}
	second.ChainHash = ExpectedHash(second.PreviousHash, second.PayloadHash, second.Kind, second.OccurredAt)
	if Verify([]Event{second, first}) != nil {
		t.Fatal("valid chain rejected")
	}
	second.PayloadHash = "changed"
	if Verify([]Event{first, second}) != ErrTampered {
		t.Fatal("tampering accepted")
	}
}
func TestCanonicalConfirmations(t *testing.T) {
	store := NewStore()
	store.Upsert(Event{ID: "1", ItemID: "item", Sequence: 1, Confirmations: 1})
	store.Upsert(Event{ID: "1", ItemID: "item", Sequence: 1, Confirmations: 5})
	if len(store.Timeline("item", 3)) != 1 {
		t.Fatal("canonical event missing")
	}
	store.Upsert(Event{ID: "1", ItemID: "item", Sequence: 1, Confirmations: 2})
	if store.Timeline("item", 3)[0].Confirmations != 5 {
		t.Fatal("older observation replaced canonical state")
	}
}
