package provenance

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"sort"
	"sync"
)

type Event struct {
	ID, ItemID, PayloadHash, PreviousHash, ChainHash, Kind, OccurredAt string
	Sequence                                                           uint64
	Confirmations                                                      uint64
}

var ErrTampered = errors.New("tampered chain")

func ExpectedHash(previous, payload, kind, occurredAt string) string {
	sum := sha256.Sum256([]byte(previous + ":" + payload + ":" + kind + ":" + occurredAt))
	return hex.EncodeToString(sum[:])
}

func Verify(events []Event) error {
	sorted := append([]Event(nil), events...)
	sort.Slice(sorted, func(i, j int) bool { return sorted[i].Sequence < sorted[j].Sequence })
	previous := ""
	for _, event := range sorted {
		if event.PreviousHash != previous || event.ChainHash != ExpectedHash(previous, event.PayloadHash, event.Kind, event.OccurredAt) {
			return ErrTampered
		}
		previous = event.ChainHash
	}
	return nil
}

type Store struct {
	mu     sync.Mutex
	events map[string]Event
}

func NewStore() *Store { return &Store{events: map[string]Event{}} }
func (s *Store) Upsert(event Event) {
	s.mu.Lock()
	defer s.mu.Unlock()
	current, ok := s.events[event.ID]
	if !ok || event.Confirmations >= current.Confirmations {
		s.events[event.ID] = event
	}
}
func (s *Store) Timeline(itemID string, minimumConfirmations uint64) []Event {
	s.mu.Lock()
	defer s.mu.Unlock()
	result := []Event{}
	for _, event := range s.events {
		if event.ItemID == itemID && event.Confirmations >= minimumConfirmations {
			result = append(result, event)
		}
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Sequence < result[j].Sequence })
	return result
}
