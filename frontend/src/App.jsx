import { useState, useRef } from "react";
import axios from "axios";

function App() {
  const [files, setFiles] = useState([]);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [activeTab, setActiveTab] = useState("answer");
  const [chatHistory, setChatHistory] = useState([]);
  const fileInputRef = useRef(null);

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setUploading(true);
    setError("");

    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/upload",
        formData,
        { timeout: 120000 }
      );
      setUploadStatus(response.data);
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError("Upload failed. Is the backend running?");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }

    setAsking(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("question", question);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/ask",
        formData,
        { timeout: 120000 }
      );
      setResult(response.data);
      setChatHistory(prev => [...prev, {
        question: question,
        answer: response.data.answer,
        sources: response.data.sources
      }]);
      setActiveTab("answer");
    } catch (err) {
      setError("Something went wrong. Is the backend running?");
      console.error(err);
    } finally {
      setAsking(false);
    }
  };

  const handleClear = async () => {
    try {
      await axios.post("http://127.0.0.1:8000/clear");
      setUploadStatus(null);
      setResult(null);
      setChatHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const tabs = [
    { id: "answer", label: "Answer" },
    { id: "sources", label: "Sources" },
    { id: "history", label: "Chat History" },
  ];

  return (
    <div style={{
      maxWidth: 900,
      margin: "0 auto",
      padding: "40px 20px",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: "#1a1a1a",
      backgroundColor: "#ffffff",
      minHeight: "100vh"
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, #39D353 0%, #1a7f37 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: "bold", fontSize: 16
          }}>SR</div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#1a1a1a" }}>
            Semantic Research Assistant
          </h1>
        </div>
        <p style={{ color: "#666", margin: 0, fontSize: 15 }}>
          Upload documents, ask questions, get answers with source citations — powered by Cohere.
        </p>
      </div>

      {/* Upload Section */}
      <div style={{
        background: "#f8f9fa",
        border: "2px dashed #dee2e6",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>
            Upload Documents (PDF or TXT)
          </label>
          {uploadStatus && (
            <button
              onClick={handleClear}
              style={{
                padding: "4px 12px", fontSize: 12, color: "#c00",
                background: "none", border: "1px solid #c00",
                borderRadius: 4, cursor: "pointer"
              }}
            >
              Clear All
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files))}
            style={{ fontSize: 14 }}
          />
          <button
            onClick={handleUpload}
            disabled={uploading || files.length === 0}
            style={{
              padding: "8px 20px", fontSize: 14, fontWeight: 600,
              color: "#fff",
              background: uploading || files.length === 0 ? "#999" : "#1a7f37",
              border: "none", borderRadius: 6,
              cursor: uploading || files.length === 0 ? "not-allowed" : "pointer"
            }}
          >
            {uploading ? "Processing..." : "Upload"}
          </button>
        </div>

        {uploading && (
          <div style={{ marginTop: 12, color: "#666", fontSize: 13 }}>
            Extracting text, chunking documents, generating embeddings...
          </div>
        )}

        {uploadStatus && (
          <div style={{
            marginTop: 12, padding: 12,
            background: "#e8f5e9", borderRadius: 6, fontSize: 13
          }}>
            <strong>{uploadStatus.message}</strong>
            <div style={{ marginTop: 6 }}>
              {uploadStatus.files.map((f, i) => (
                <div key={i} style={{ color: "#555" }}>
                  {f.filename} → {f.chunks} chunks
                </div>
              ))}
            </div>
            <div style={{ marginTop: 4, color: "#1a7f37" }}>
              Total chunks in database: {uploadStatus.total_chunks_in_db}
            </div>
          </div>
        )}
      </div>

      {/* Question Section */}
      <div style={{
        background: "#f8f9fa",
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        border: "1px solid #dee2e6"
      }}>
        <label style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>
          Ask a question about your documents
        </label>
        <div style={{ display: "flex", gap: 12 }}>
          <textarea
            placeholder="e.g. What are the main findings of the study? How does the author define X?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            rows={2}
            style={{
              flex: 1, padding: 12, fontSize: 14,
              borderRadius: 8, border: "1px solid #dee2e6",
              resize: "vertical", boxSizing: "border-box",
              color: "#1a1a1a", backgroundColor: "#ffffff"
            }}
          />
          <button
            onClick={handleAsk}
            disabled={asking || !question.trim()}
            style={{
              padding: "12px 24px", fontSize: 15, fontWeight: 600,
              color: "#fff", alignSelf: "flex-end",
              background: asking || !question.trim()
                ? "#999"
                : "linear-gradient(135deg, #39D353 0%, #1a7f37 100%)",
              border: "none", borderRadius: 8,
              cursor: asking || !question.trim() ? "not-allowed" : "pointer"
            }}
          >
            {asking ? "Searching..." : "Ask"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: "#fff5f5", border: "1px solid #fcc",
          borderRadius: 8, padding: 12, marginBottom: 20,
          color: "#c00", fontSize: 14
        }}>
          {error}
        </div>
      )}

      {/* Loading */}
      {asking && (
        <div style={{
          background: "#f0fff0", border: "1px solid #b3e6b3",
          borderRadius: 8, padding: 16, marginBottom: 20,
          display: "flex", alignItems: "center", gap: 12
        }}>
          <div style={{
            width: 20, height: 20,
            border: "3px solid #ddd", borderTop: "3px solid #1a7f37",
            borderRadius: "50%", animation: "spin 1s linear infinite"
          }} />
          <span style={{ color: "#444", fontSize: 14 }}>
            Searching documents and generating answer...
          </span>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results */}
      {result && (
        <div>
          {/* Tabs */}
          <div style={{
            display: "flex", gap: 4, borderBottom: "2px solid #eee"
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 18px", background: "none",
                  color: activeTab === tab.id ? "#1a7f37" : "#888",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "2px solid #1a7f37" : "2px solid transparent",
                  cursor: "pointer",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  fontSize: 14, marginBottom: -2
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{
            padding: 20, border: "1px solid #eee",
            borderTop: "none", borderRadius: "0 0 8px 8px",
            minHeight: 200, backgroundColor: "#ffffff"
          }}>
            {activeTab === "answer" && (
              <div>
                <div style={{
                  whiteSpace: "pre-wrap", lineHeight: 1.8,
                  fontSize: 15, color: "#1a1a1a"
                }}>
                  {result.answer}
                </div>
                {result.sources && result.sources.length > 0 && (
                  <div style={{
                    marginTop: 16, paddingTop: 12,
                    borderTop: "1px solid #eee", fontSize: 13, color: "#666"
                  }}>
                    Sources: {result.sources.join(", ")} • {result.num_chunks_used} chunks used
                  </div>
                )}
              </div>
            )}

            {activeTab === "sources" && (
              <div>
                {result.context_chunks && result.context_chunks.map((chunk, i) => (
                  <div key={i} style={{
                    padding: 12, marginBottom: 8,
                    background: "#f8f9fa", borderRadius: 6,
                    borderLeft: "3px solid #1a7f37"
                  }}>
                    <div style={{
                      fontSize: 12, fontWeight: 600,
                      color: "#1a7f37", marginBottom: 4
                    }}>
                      {chunk.source}
                    </div>
                    <div style={{
                      fontSize: 13, color: "#444", lineHeight: 1.5
                    }}>
                      {chunk.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "history" && (
              <div>
                {chatHistory.length === 0 ? (
                  <div style={{ color: "#888", fontSize: 14 }}>
                    No questions asked yet.
                  </div>
                ) : (
                  chatHistory.map((item, i) => (
                    <div key={i} style={{
                      padding: 12, marginBottom: 12,
                      borderBottom: "1px solid #eee"
                    }}>
                      <div style={{
                        fontSize: 14, fontWeight: 600,
                        color: "#1a7f37", marginBottom: 6
                      }}>
                        Q: {item.question}
                      </div>
                      <div style={{
                        fontSize: 13, color: "#444",
                        lineHeight: 1.5, whiteSpace: "pre-wrap"
                      }}>
                        {item.answer}
                      </div>
                      <div style={{
                        fontSize: 11, color: "#999", marginTop: 4
                      }}>
                        Sources: {item.sources.join(", ")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        marginTop: 40, paddingTop: 20,
        borderTop: "1px solid #eee", color: "#999",
        fontSize: 12, textAlign: "center"
      }}>
        Powered by Cohere Embed + Command • ChromaDB • Built by Tejan
      </div>
    </div>
  );
}

export default App;