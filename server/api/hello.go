package handler

import (
	"fmt"
	"net/http"
)

// Handler is the main entry point to Vercel Go serverless function
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	
	fmt.Fprintf(w, `{"status": "success", "message": "Ini adalah response dari Backend Golang yang berjalan di Vercel!"}`)
}
