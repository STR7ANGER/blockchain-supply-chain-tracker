package main

import (
	"encoding/json"
	"net/http"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, _ *http.Request) {
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok", "service": "chain-indexer"})
	})
	_ = http.ListenAndServe(":8082", nil)
}
