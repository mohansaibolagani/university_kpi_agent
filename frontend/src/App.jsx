import React, { useState, useEffect, useRef } from "react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

const QUICK_UNIVERSITIES = [
  "Harvard University",
  "Massachusetts Institute of Technology",
  "Stanford University",
  "University of Cambridge",
  "University of Oxford",
  "University of Tokyo",
  "Princeton University",
  "Columbia University"
];

export default function App() {
  // Navigation & System State
  const [activeTab, setActiveTab] = useState("deep-dive"); // "overview", "deep-dive", "compare", "rankings"
  const [backendOnline, setBackendOnline] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Autocomplete
  const [searchQuery, setSearchQuery] = useState("Harvard University");
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // University Deep Dive State
  const [selectedUniversity, setSelectedUniversity] = useState("Harvard University");
  const [universityHistory, setUniversityHistory] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [healthData, setHealthData] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [copiedInsight, setCopiedInsight] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Standout Feature 1: What-If KPI Simulator
  const [simAdjustments, setSimAdjustments] = useState({
    citations: 5,
    patents: 10,
    quality_of_faculty: 3,
    quality_of_education: 3,
    publications: 5,
  });
  const [simulationResult, setSimulationResult] = useState(null);
  const [simLoading, setSimLoading] = useState(false);

  // Standout Feature 2: Multi-Dimensional Radar Benchmark
  const [radarData, setRadarData] = useState(null);

  // Standout Feature 3: Country Academic Power Index
  const [countryPowerIndex, setCountryPowerIndex] = useState([]);

  // Standout Feature 4: Strategic ROI Capital Allocation & Payback Estimator
  const [roiBudgetTier, setRoiBudgetTier] = useState("moderate"); // "conservative" ($15M), "moderate" ($45M), "aggressive" ($100M)
  const [roiData, setRoiData] = useState(null);
  const [roiLoading, setRoiLoading] = useState(false);

  // Standout Feature 5: Multi-Institution Benchmark Shortlist & Comparative Matrix
  const [shortlist, setShortlist] = useState([
    "Harvard University",
    "Massachusetts Institute of Technology",
    "Stanford University",
    "University of Cambridge"
  ]);
  const [shortlistMatrix, setShortlistMatrix] = useState([]);
  const [shortlistLoading, setShortlistLoading] = useState(false);

  // Standout Feature 6: Interactive Global Geographic Academic Hub Drawer
  const [selectedGeoCountry, setSelectedGeoCountry] = useState(null);
  const [geoCountryData, setGeoCountryData] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Comparison State
  const [compareInst1, setCompareInst1] = useState("Harvard University");
  const [compareInst2, setCompareInst2] = useState("Stanford University");
  const [compareYear, setCompareYear] = useState(2015);
  const [comparisonData, setComparisonData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  // Global Rankings Explorer State
  const [rankingsYear, setRankingsYear] = useState(2015);
  const [rankingsCountry, setRankingsCountry] = useState("");
  const [rankingsSortBy, setRankingsSortBy] = useState("world_rank");
  const [rankingsOrder, setRankingsOrder] = useState("asc");
  const [rankingsPage, setRankingsPage] = useState(1);
  const [rankingsData, setRankingsData] = useState(null);
  const [countriesList, setCountriesList] = useState([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);

  // Chatbot State
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your University KPI AI Strategic Advisor. Ask me anything about university performance, CWUR rankings, trajectory shifts, or institutional comparisons.",
      source: "AI Strategic Advisor"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Voice Assistant State
  const [isListening, setIsListening] = useState(false);
  const [listeningTarget, setListeningTarget] = useState(null); // "search" | "chat"
  const [liveTranscript, setLiveTranscript] = useState("");
  const [voiceGuideOpen, setVoiceGuideOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const activeRecognizerRef = useRef(null);

  // 1. Initial System Check & Stats
  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then((res) => {
        if (!res.ok) throw new Error("Stats fetch failed");
        return res.json();
      })
      .then((data) => {
        setStats(data);
        setBackendOnline(true);
      })
      .catch(() => {
        setBackendOnline(false);
      });

    fetch(`${API_BASE}/countries`)
      .then((res) => res.json())
      .then((list) => setCountriesList(list))
      .catch(() => {});

    fetch(`${API_BASE}/countries/power-index`)
      .then((res) => res.json())
      .then((data) => setCountryPowerIndex(data))
      .catch(() => {});

    // Initial university load & shortlist matrix
    loadUniversity("Harvard University");
    refreshShortlistMatrix([
      "Harvard University",
      "Massachusetts Institute of Technology",
      "Stanford University",
      "University of Cambridge"
    ]);

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (activeRecognizerRef.current) {
        try {
          activeRecognizerRef.current.abort();
        } catch (e) {}
      }
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, chatOpen]);

  // 2. Search Autocomplete Debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      fetch(`${API_BASE}/universities/search?query=${encodeURIComponent(searchQuery)}&limit=6`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSuggestions(data);
            setShowDropdown(true);
          }
        })
        .catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 3. Load Deep Dive Data
  const loadUniversity = (instName) => {
    if (!instName) return;
    const clean = instName.replace(/[.?!,;:"'’]+$/, "").trim();
    if (!clean) return;

    setLoading(true);
    setErrorMsg("");
    setSelectedUniversity(clean);
    setSearchQuery(clean);
    setShowDropdown(false);
    setActiveTab("deep-dive");
    setSimulationResult(null);

    Promise.all([
      fetch(`${API_BASE}/university/${encodeURIComponent(clean)}`).then((r) => r.json()),
      fetch(`${API_BASE}/university/${encodeURIComponent(clean)}/trend`).then((r) => r.json()),
      fetch(`${API_BASE}/health/${encodeURIComponent(clean)}`).then((r) => r.json()),
      fetch(`${API_BASE}/ai-insight/${encodeURIComponent(clean)}`).then((r) => r.json()),
      fetch(`${API_BASE}/university/${encodeURIComponent(clean)}/radar`).then((r) => r.json()),
      fetch(`${API_BASE}/university/${encodeURIComponent(clean)}/roi-strategy?budget_tier=${roiBudgetTier}`).then((r) => r.json()),
    ])
      .then(([history, trend, health, insight, radar, roi]) => {
        if (history.detail || history.message) {
          setErrorMsg(history.detail || history.message);
          setUniversityHistory([]);
        } else {
          setUniversityHistory(history);
          if (history[0]?.institution) {
            setSelectedUniversity(history[0].institution);
            setSearchQuery(history[0].institution);
          }
          const latest = history[history.length - 1];
          // Pre-populate simulator with actual ranks
          const initAdj = {
            citations: latest.citations || 20,
            patents: latest.patents || 20,
            quality_of_faculty: latest.quality_of_faculty || 15,
            quality_of_education: latest.quality_of_education || 15,
            publications: latest.publications || 20,
          };
          setSimAdjustments(initAdj);
        }

        setTrendData(Array.isArray(trend) ? trend : []);
        setHealthData(health.detail ? null : health);
        setAiInsight(insight.detail ? null : insight);
        setRadarData(radar.detail ? null : radar);
        setRoiData(roi.detail ? null : roi);
      })
      .catch(() => {
        setErrorMsg("Failed to communicate with University KPI backend.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Helper: Refresh ROI Strategy with different budget tiers
  const fetchRoiStrategy = (tier) => {
    setRoiBudgetTier(tier);
    setRoiLoading(true);
    fetch(`${API_BASE}/university/${encodeURIComponent(selectedUniversity)}/roi-strategy?budget_tier=${tier}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.detail) {
          setRoiData(data);
        }
      })
      .catch(() => {})
      .finally(() => setRoiLoading(false));
  };

  // Helper: Load Multi-Institution Shortlist Matrix
  const refreshShortlistMatrix = (currentList = shortlist) => {
    if (!currentList || currentList.length === 0) {
      setShortlistMatrix([]);
      return;
    }
    setShortlistLoading(true);
    Promise.all(
      currentList.map((inst) =>
        fetch(`${API_BASE}/university/${encodeURIComponent(inst)}`)
          .then((r) => r.json())
          .then((data) => (Array.isArray(data) && data.length > 0 ? data[data.length - 1] : null))
          .catch(() => null)
      )
    )
      .then((results) => {
        setShortlistMatrix(results.filter(Boolean));
      })
      .catch(() => {})
      .finally(() => setShortlistLoading(false));
  };

  // Helper: Toggle Shortlist Institution
  const toggleShortlistInstitution = (inst) => {
    if (!inst) return;
    setShortlist((prev) => {
      let next;
      if (prev.includes(inst)) {
        next = prev.filter((item) => item !== inst);
      } else {
        if (prev.length >= 6) {
          setErrorMsg("Maximum 6 institutions allowed in benchmark shortlist.");
          return prev;
        }
        next = [...prev, inst];
      }
      refreshShortlistMatrix(next);
      return next;
    });
  };

  // Helper: Select Geographic Academic Hub
  const selectGeoCountry = (countryName) => {
    if (selectedGeoCountry === countryName) {
      setSelectedGeoCountry(null);
      setGeoCountryData(null);
      return;
    }
    setSelectedGeoCountry(countryName);
    setGeoLoading(true);
    fetch(`${API_BASE}/rankings?country=${encodeURIComponent(countryName)}&page_size=8&sort_by=world_rank`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.detail) {
          setGeoCountryData(data);
        }
      })
      .catch(() => {})
      .finally(() => setGeoLoading(false));
  };

  // 4. Feature 1: Run KPI Simulation
  const runSimulation = (customAdj) => {
    const adj = customAdj || simAdjustments;
    setSimLoading(true);
    fetch(`${API_BASE}/university/${encodeURIComponent(selectedUniversity)}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adj),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.detail) {
          setSimulationResult(data);
        }
      })
      .catch(() => {})
      .finally(() => setSimLoading(false));
  };

  // 5. Comparison Fetch
  const runComparison = (inst1 = compareInst1, inst2 = compareInst2, year = compareYear) => {
    if (!inst1 || !inst2) return;
    setCompareLoading(true);
    fetch(`${API_BASE}/compare?inst1=${encodeURIComponent(inst1)}&inst2=${encodeURIComponent(inst2)}&year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.detail) {
          setErrorMsg(data.detail);
          setComparisonData(null);
        } else {
          setComparisonData(data);
          setErrorMsg("");
        }
      })
      .catch(() => {
        setErrorMsg("Failed to generate university comparison.");
      })
      .finally(() => setCompareLoading(false));
  };

  useEffect(() => {
    if (activeTab === "compare") {
      runComparison(compareInst1, compareInst2, compareYear);
    }
  }, [activeTab, compareYear]);

  // 6. Rankings Explorer Fetch
  useEffect(() => {
    if (activeTab !== "rankings") return;
    setRankingsLoading(true);

    const countryParam = rankingsCountry ? `&country=${encodeURIComponent(rankingsCountry)}` : "";
    const url = `${API_BASE}/rankings?year=${rankingsYear}&sort_by=${rankingsSortBy}&order=${rankingsOrder}&page=${rankingsPage}&page_size=15${countryParam}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setRankingsData(data);
      })
      .catch(() => {})
      .finally(() => setRankingsLoading(false));
  }, [activeTab, rankingsYear, rankingsCountry, rankingsSortBy, rankingsOrder, rankingsPage]);

  // 7. PDF Export Handler
  const downloadPdf = async (instName = selectedUniversity) => {
    if (!instName) return;
    setPdfDownloading(true);
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE}/university/${encodeURIComponent(instName)}/pdf`);
      if (!res.ok) {
        throw new Error("PDF generation service returned error");
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${instName.replace(/\s+/g, "_")}_KPI_Dossier.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setErrorMsg("Failed to download executive PDF dossier. Please ensure the backend is running.");
    } finally {
      setPdfDownloading(false);
    }
  };

  // 8. Text-to-Speech (Voice Playback)
  const cleanMarkdownForSpeech = (rawText) => {
    if (!rawText) return "";
    return rawText
      .replace(/###/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/•/g, "")
      .replace(/#/g, "Number ")
      .replace(/_/g, "")
      .replace(/\[.*?\]\(.*?\)/g, "")
      .trim();
  };

  const speakText = (text, speakingId = "general") => {
    if (!window.speechSynthesis) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking && currentlySpeakingId === speakingId) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = cleanMarkdownForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha"))
    );
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentlySpeakingId(speakingId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setCurrentlySpeakingId(null);
  };

  // 9. Robust Voice Recognition & Voice Commands
  const handleVoiceCommand = (rawTranscript, target) => {
    const transcript = rawTranscript.trim();
    if (!transcript) return;
    const lower = transcript.toLowerCase();

    // Command 1: Tab Navigation
    if (lower.includes("overview") || lower.includes("dashboard")) {
      setActiveTab("overview");
      return;
    }
    if (lower.includes("directory") || lower.includes("ranking") || lower.includes("rankings")) {
      setActiveTab("rankings");
      return;
    }
    if (lower === "compare" || lower === "go to compare" || lower === "head to head") {
      setActiveTab("compare");
      return;
    }
    if (lower.includes("deep dive") || lower.includes("profile")) {
      setActiveTab("deep-dive");
      return;
    }

    // Command 2: Head-to-Head Comparison
    if (lower.startsWith("compare ") || lower.includes(" compare ")) {
      const match = transcript.match(/compare\s+(.+?)\s+(and|with|to|vs)\s+(.+)/i);
      if (match) {
        const u1 = match[1].trim();
        const u3 = match[3].trim();
        setActiveTab("compare");
        setCompareInst1(u1);
        setCompareInst2(u3);
        runComparison(u1, u3, compareYear);
        return;
      }
    }

    // Command 3: PDF Dossier Export
    if (lower.includes("pdf") || lower.includes("dossier") || lower.includes("export report") || lower.includes("download report")) {
      downloadPdf(selectedUniversity);
      return;
    }

    // Command 4: Audio Controls
    if (lower.includes("stop audio") || lower.includes("stop speaking") || lower.includes("be quiet") || lower === "stop") {
      stopSpeaking();
      return;
    }
    if (lower.includes("read aloud") || lower.includes("read brief") || lower.includes("speak brief") || lower.includes("listen")) {
      if (aiInsight?.insight) {
        speakText(aiInsight.insight, "panel-brief");
      }
      return;
    }

    // Command 5: Questions -> Automatically route to AI Strategic Advisor
    const isQuestion =
      lower.startsWith("what") ||
      lower.startsWith("how") ||
      lower.startsWith("why") ||
      lower.startsWith("who") ||
      lower.startsWith("which") ||
      lower.startsWith("can") ||
      lower.startsWith("tell me") ||
      lower.startsWith("explain") ||
      lower.includes("weakness") ||
      lower.includes("strength") ||
      lower.includes("recommend") ||
      lower.includes("improve") ||
      lower.endsWith("?");

    if (isQuestion || target === "chat") {
      setChatOpen(true);
      sendChatMessage(transcript);
      return;
    }

    // Command 6: University lookup / analyze command
    let cleanName = transcript.replace(/[.?!,;:"'’]+$/, "").trim();
    if (lower.startsWith("analyze ") || lower.startsWith("search ") || lower.startsWith("open ") || lower.startsWith("show ")) {
      cleanName = cleanName.replace(/^(analyze|search|open|show)\s+/i, "").replace(/[.?!,;:"'’]+$/, "").trim();
    }

    loadUniversity(cleanName);
  };

  const startListening = (target = "search") => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setErrorMsg("Voice recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or a browser with Web Speech API support.");
      return;
    }

    if (activeRecognizerRef.current) {
      try {
        activeRecognizerRef.current.abort();
      } catch (e) {}
      activeRecognizerRef.current = null;
    }

    try {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.lang = "en-US";

      recognizer.onstart = () => {
        setIsListening(true);
        setListeningTarget(target);
        setLiveTranscript("");
      };

      recognizer.onresult = (event) => {
        let interim = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interim;
        setLiveTranscript(currentText);

        if (finalTranscript) {
          setIsListening(false);
          setListeningTarget(null);
          handleVoiceCommand(finalTranscript, target);
        }
      };

      recognizer.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
        setListeningTarget(null);
        if (event.error === "not-allowed") {
          setErrorMsg("Microphone permission was denied. Please allow microphone access in your browser address bar.");
        } else if (event.error === "no-speech") {
          setErrorMsg("No speech detected. Please speak closer to your microphone.");
        } else if (event.error === "network") {
          setErrorMsg("Voice recognition network error. Please verify your internet connection.");
        }
      };

      recognizer.onend = () => {
        setIsListening(false);
        setListeningTarget(null);
      };

      activeRecognizerRef.current = recognizer;
      recognizer.start();
    } catch (err) {
      console.error("Failed to start voice recognition:", err);
      setIsListening(false);
      setListeningTarget(null);
      setErrorMsg("Could not start microphone: " + err.message);
    }
  };

  const stopListening = () => {
    if (activeRecognizerRef.current) {
      try {
        activeRecognizerRef.current.stop();
      } catch (e) {}
      activeRecognizerRef.current = null;
    }
    setIsListening(false);
    setListeningTarget(null);
    setLiveTranscript("");
  };

  const toggleListening = (target = "search") => {
    if (isListening) {
      stopListening();
    } else {
      startListening(target);
    }
  };

  // 10. Chatbot Send Handler
  const sendChatMessage = async (presetText) => {
    const text = presetText || chatInput;
    if (!text || !text.trim() || chatLoading) return;

    const userMsg = { role: "user", content: text };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          university: selectedUniversity,
          history: chatMessages.slice(-6).map((m) => ({
            role: m.role === "user" ? "user" : "model",
            content: m.content
          }))
        })
      });

      if (!res.ok) throw new Error("Chat service error");
      const data = await res.json();
      const replyMsg = {
        role: "assistant",
        content: data.reply,
        source: data.source,
        context: data.context_institution
      };

      setChatMessages([...nextMessages, replyMsg]);

      if (voiceModeActive) {
        speakText(data.reply, `chat-${nextMessages.length}`);
      }
    } catch (err) {
      setChatMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "I encountered a communication issue with the analytics agent. Please verify backend status.",
          source: "System Error"
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Copy AI Insight Handler
  const handleCopyInsight = () => {
    if (!aiInsight?.insight) return;
    navigator.clipboard.writeText(aiInsight.insight);
    setCopiedInsight(true);
    setTimeout(() => setCopiedInsight(false), 2000);
  };

  const latestRec = universityHistory.length > 0 ? universityHistory[universityHistory.length - 1] : null;

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-logo-icon">🎓</div>
          <div>
            <div className="brand-title">
              University KPI <span>Intelligence</span>
            </div>
            <div className="brand-subtitle">
              CWUR Global Benchmark & AI Strategic Monitoring Agent
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === "deep-dive" ? "active" : ""}`}
            onClick={() => setActiveTab("deep-dive")}
          >
            🏛️ Deep-Dive
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview & Power Index
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "compare" ? "active" : ""}`}
            onClick={() => setActiveTab("compare")}
          >
            ⚔️ Head-to-Head
          </button>
          <button
            className={`nav-tab-btn ${activeTab === "rankings" ? "active" : ""}`}
            onClick={() => setActiveTab("rankings")}
          >
            🌍 Directory
          </button>
          <button
            className={`nav-tab-btn ${chatOpen ? "active" : ""}`}
            onClick={() => setChatOpen(!chatOpen)}
            style={{ background: chatOpen ? "var(--accent-violet)" : "transparent" }}
          >
            💬 AI Advisor
          </button>
        </nav>

        {/* System Heartbeat & Voice Audio Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isSpeaking && (
            <button
              className="speak-btn speaking"
              onClick={stopSpeaking}
              title="Stop audio playback"
            >
              ⏹️ Stop Audio
            </button>
          )}

          <div className="system-status">
            <span className={`pulse-dot ${backendOnline ? "online" : "offline"}`}></span>
            <span>{backendOnline ? "Connected (2.2k Records)" : "Connecting..."}</span>
          </div>
        </div>
      </header>

      {/* Global Hero Search Bar with Autocomplete & Voice Mic */}
      <section className="search-hero" ref={dropdownRef}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search any global university or say 'Analyze Oxford'..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                loadUniversity(searchQuery);
              }
            }}
          />

          {/* Search Bar Microphone Button */}
          <button
            type="button"
            className={`mic-btn ${isListening && listeningTarget === "search" ? "listening" : ""}`}
            onClick={() => toggleListening("search")}
            title={isListening && listeningTarget === "search" ? "Listening... Click to stop" : "Speak search query or voice command"}
          >
            {isListening && listeningTarget === "search" ? (
              <div className="waveform-container">
                <span className="waveform-bar"></span>
                <span className="waveform-bar"></span>
                <span className="waveform-bar"></span>
                <span className="waveform-bar"></span>
              </div>
            ) : (
              "🎙️"
            )}
          </button>

          <button
            className="search-action-btn"
            style={{ marginLeft: "8px" }}
            onClick={() => loadUniversity(searchQuery)}
          >
            Analyze KPI
          </button>
        </div>

        {/* Live Voice Listening Banner with Real-time Speech Transcription */}
        {isListening && (
          <div className="voice-listening-banner">
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span>🔴 Listening ({listeningTarget === "search" ? "Search Bar" : "AI Advisor"})...</span>
              {liveTranscript ? (
                <span className="voice-live-transcript">"{liveTranscript}"</span>
              ) : (
                <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>Speak now (e.g. "Analyze Oxford", "Compare Harvard and MIT")</span>
              )}
            </div>
            <button
              style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontWeight: 700 }}
              onClick={stopListening}
            >
              Cancel ✕
            </button>
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="autocomplete-dropdown animate-fade-in">
            {suggestions.map((item) => (
              <div
                key={item.institution}
                className="autocomplete-item"
                onClick={() => loadUniversity(item.institution)}
              >
                <div>
                  <div className="auto-inst-title">{item.institution}</div>
                  <div className="auto-inst-meta">
                    📍 {item.country} • Latest Year: {item.latest_year}
                  </div>
                </div>
                <div className="auto-inst-badge">
                  Rank #{item.latest_rank} • {item.latest_score.toFixed(1)} pts
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Pick Chips & Voice Guide Button */}
        <div className="quick-chips-wrapper">
          <span className="quick-chips-label">Quick Pick:</span>
          {QUICK_UNIVERSITIES.map((name) => (
            <button
              key={name}
              className="quick-chip"
              onClick={() => loadUniversity(name)}
            >
              {name.replace("University of ", "").replace(" University", "")}
            </button>
          ))}
          <button
            className="voice-guide-btn"
            onClick={() => setVoiceGuideOpen(true)}
            title="View supported voice commands"
          >
            🎙️ Voice Commands Guide
          </button>
        </div>
      </section>

      {/* Voice Command Guide Modal */}
      {voiceGuideOpen && (
        <div className="voice-modal-backdrop" onClick={() => setVoiceGuideOpen(false)}>
          <div className="voice-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="voice-modal-header">
              <div className="voice-modal-title">
                <span>🎙️</span>
                <span>Voice Commands & Speech Assistant</span>
              </div>
              <button
                className="chat-action-icon"
                onClick={() => setVoiceGuideOpen(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>
              Click the microphone button (<strong>🎙️</strong>) in the search bar or chat drawer, and speak naturally. The platform executes the following voice commands:
            </p>

            <div className="voice-cmd-card">
              <div className="voice-cmd-row">
                <span className="voice-cmd-phrase">"Analyze Oxford"</span>
                <span className="voice-cmd-desc">Opens the deep-dive performance dashboard for that university.</span>
              </div>
              <div className="voice-cmd-row">
                <span className="voice-cmd-phrase">"Compare Harvard and MIT"</span>
                <span className="voice-cmd-desc">Automatically switches to Head-to-Head and benchmarks both institutions.</span>
              </div>
              <div className="voice-cmd-row">
                <span className="voice-cmd-phrase">"Download PDF"</span>
                <span className="voice-cmd-desc">Generates and exports the publication-grade executive dossier.</span>
              </div>
              <div className="voice-cmd-row">
                <span className="voice-cmd-phrase">"Go to Overview" / "Directory"</span>
                <span className="voice-cmd-desc">Instantly navigates between the platform views.</span>
              </div>
              <div className="voice-cmd-row">
                <span className="voice-cmd-phrase">"What are Harvard's weaknesses?"</span>
                <span className="voice-cmd-desc">Opens the AI Strategic Advisor and provides immediate conversational intelligence.</span>
              </div>
              <div className="voice-cmd-row">
                <span className="voice-cmd-phrase">"Read aloud" / "Stop audio"</span>
                <span className="voice-cmd-desc">Controls text-to-speech spoken briefing.</span>
              </div>
            </div>

            <div style={{ textAlign: "right", marginTop: "18px" }}>
              <button
                className="search-action-btn"
                onClick={() => setVoiceGuideOpen(false)}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        {errorMsg && (
          <div style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            color: "#f87171",
            padding: "12px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <span>⚠️ {errorMsg}</span>
            <button
              style={{ background: "transparent", border: "none", color: "#f87171", cursor: "pointer", fontSize: "1.1rem" }}
              onClick={() => setErrorMsg("")}
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= VIEW 1: UNIVERSITY DEEP DIVE ================= */}
        {activeTab === "deep-dive" && (
          <div>
            {loading ? (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Synthesizing University Performance Metrics & AI Brief...</p>
              </div>
            ) : latestRec ? (
              <div className="animate-fade-in">
                {/* Hero Card */}
                <div className="univ-hero-card">
                  <div>
                    <div className="univ-hero-meta">
                      <span className="badge badge-indigo">
                        📍 {latestRec.country}
                      </span>
                      {latestRec.national_rank && (
                        <span className="badge badge-indigo">
                          National #{latestRec.national_rank}
                        </span>
                      )}
                      <span className="badge badge-green">
                        Cycle {latestRec.year}
                      </span>
                    </div>
                    <h1 className="univ-hero-title">{latestRec.institution}</h1>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "16px" }}>
                      Official Center for World University Rankings (CWUR) Profile
                    </p>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {/* PDF Export Button */}
                      <button
                        className="pdf-export-btn"
                        disabled={pdfDownloading}
                        onClick={() => downloadPdf(latestRec.institution)}
                      >
                        {pdfDownloading ? "⏳ Generating PDF..." : "📄 Export Executive PDF Dossier"}
                      </button>

                      {/* Voice Briefing Button */}
                      {aiInsight && (
                        <button
                          className={`speak-btn ${isSpeaking && currentlySpeakingId === "hero-brief" ? "speaking" : ""}`}
                          style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "0.85rem" }}
                          onClick={() => speakText(aiInsight.insight, "hero-brief")}
                        >
                          {isSpeaking && currentlySpeakingId === "hero-brief" ? "⏹️ Stop Spoken Brief" : "🔊 Listen to Strategic Brief"}
                        </button>
                      )}

                      {/* Add to Shortlist Button */}
                      <button
                        className="quick-chip"
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          fontSize: "0.85rem",
                          background: shortlist.includes(latestRec.institution) ? "rgba(251, 191, 36, 0.15)" : "transparent",
                          borderColor: shortlist.includes(latestRec.institution) ? "#fbbf24" : "var(--border)",
                          color: shortlist.includes(latestRec.institution) ? "#fbbf24" : "var(--text-primary)"
                        }}
                        onClick={() => toggleShortlistInstitution(latestRec.institution)}
                      >
                        {shortlist.includes(latestRec.institution) ? "★ Shortlisted in Peer Matrix" : "☆ Add to Benchmark Shortlist"}
                      </button>
                    </div>
                  </div>

                  <div className="univ-stat-clusters">
                    <div className="stat-cluster">
                      <div className="stat-cluster-val">#{latestRec.world_rank}</div>
                      <div className="stat-cluster-label">World Rank</div>
                    </div>
                    <div className="stat-cluster">
                      <div className="stat-cluster-val" style={{ color: "var(--accent-cyan)" }}>
                        {latestRec.score.toFixed(1)}
                      </div>
                      <div className="stat-cluster-label">Aggregate Score</div>
                    </div>
                  </div>
                </div>

                {/* Health & Tier Assessment Section */}
                {healthData && (
                  <div className="health-overview-grid">
                    {/* Status & Tier */}
                    <div className="panel-card">
                      <div className="panel-title">
                        <span>🏥 Institutional Health Scorecard</span>
                        <span className={`badge badge-${healthData.status.toLowerCase()}`}>
                          Status: {healthData.status}
                        </span>
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <div style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff" }}>
                          {healthData.tier}
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginTop: "4px" }}>
                          Ranked in top <strong>{(100 - healthData.percentile).toFixed(1)}%</strong> of world universities ({healthData.percentile}th percentile worldwide).
                        </p>
                      </div>

                      {/* Percentile Meter */}
                      <div style={{ marginTop: "20px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                          <span>Global Percentile Standing</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{healthData.percentile}%</span>
                        </div>
                        <div className="dist-bar-track" style={{ height: "10px" }}>
                          <div
                            className="dist-bar-fill"
                            style={{
                              width: `${healthData.percentile}%`,
                              background: healthData.status === "Green"
                                ? "linear-gradient(90deg, #10b981, #06b6d4)"
                                : healthData.status === "Yellow"
                                ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                : "linear-gradient(90deg, #ef4444, #f87171)"
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Competitive Strengths & Focus Areas */}
                    <div className="panel-card">
                      <div className="panel-title">
                        <span>🎯 Diagnostic Dimensions</span>
                        <span className="badge badge-indigo">Multi-KPI</span>
                      </div>

                      <div className="pill-list">
                        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-emerald)", fontWeight: 700 }}>
                          Competitive Strengths
                        </div>
                        {healthData.strengths?.map((item, idx) => (
                          <div key={idx} className="pill-item strength">
                            <span>⭐</span>
                            <span>{item}</span>
                          </div>
                        ))}

                        <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent-amber)", fontWeight: 700, marginTop: "8px" }}>
                          Areas Needing Strategic Focus
                        </div>
                        {healthData.vulnerabilities?.map((item, idx) => (
                          <div key={idx} className="pill-item vulnerability">
                            <span>⚠️</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* FEATURE 2: MULTI-DIMENSIONAL SVG RADAR / SPIDER WEB CHART */}
                {radarData && (
                  <div className="panel-card" style={{ marginBottom: "24px" }}>
                    <div className="panel-title">
                      <span>🕸️ Multi-Dimensional KPI Competence Radar</span>
                      <span className="badge badge-indigo">Competence vs Global Top 10 Elite</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
                      Holistic 7-axis competence map comparing {radarData.institution}'s dimensional mastery against the world's Top 10 universities.
                    </p>

                    <div className="radar-wrapper">
                      <svg className="radar-svg" viewBox="0 0 380 340">
                        {/* Concentric Polygons */}
                        {[1.0, 0.75, 0.5, 0.25].map((scale, sIdx) => {
                          const cx = 190, cy = 170, r = 110 * scale;
                          const numAxes = 7;
                          const pts = Array.from({ length: numAxes }).map((_, i) => {
                            const angle = (i * 2 * Math.PI) / numAxes - Math.PI / 2;
                            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                          }).join(" ");
                          return (
                            <polygon
                              key={sIdx}
                              points={pts}
                              fill="none"
                              stroke="rgba(255,255,255,0.08)"
                              strokeDasharray={scale < 1.0 ? "3" : "0"}
                            />
                          );
                        })}

                        {/* Axis Radial Lines & Labels */}
                        {radarData.dimensions.map((dim, i) => {
                          const cx = 190, cy = 170, r = 110;
                          const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                          const x2 = cx + r * Math.cos(angle);
                          const y2 = cy + r * Math.sin(angle);
                          const labelX = cx + (r + 26) * Math.cos(angle);
                          const labelY = cy + (r + 26) * Math.sin(angle) + 4;

                          return (
                            <g key={dim}>
                              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" />
                              <text
                                x={labelX}
                                y={labelY}
                                fill="#cbd5e1"
                                fontSize="11"
                                fontWeight="600"
                                textAnchor="middle"
                              >
                                {dim}
                              </text>
                            </g>
                          );
                        })}

                        {/* Top 10 Benchmark Polygon (Dotted Cyan) */}
                        <polygon
                          points={radarData.top10_benchmark.map((val, i) => {
                            const cx = 190, cy = 170, r = (val / 100) * 110;
                            const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                          }).join(" ")}
                          fill="rgba(6, 182, 212, 0.1)"
                          stroke="#06b6d4"
                          strokeWidth="2"
                          strokeDasharray="4"
                        />

                        {/* Institution Polygon (Glowing Indigo) */}
                        <polygon
                          points={radarData.institution_scores.map((val, i) => {
                            const cx = 190, cy = 170, r = (val / 100) * 110;
                            const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                          }).join(" ")}
                          fill="rgba(99, 102, 241, 0.35)"
                          stroke="#6366f1"
                          strokeWidth="3"
                        />

                        {/* Institution Vertex Dots */}
                        {radarData.institution_scores.map((val, i) => {
                          const cx = 190, cy = 170, r = (val / 100) * 110;
                          const angle = (i * 2 * Math.PI) / 7 - Math.PI / 2;
                          return (
                            <circle
                              key={i}
                              cx={cx + r * Math.cos(angle)}
                              cy={cy + r * Math.sin(angle)}
                              r="4.5"
                              fill="#818cf8"
                              stroke="#ffffff"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                      </svg>

                      {/* Radar Legend */}
                      <div className="radar-legend">
                        <div>
                          <span className="radar-legend-dot" style={{ background: "#6366f1" }}></span>
                          <strong>{radarData.institution}</strong> ({radarData.overall_competence}% Competence Index)
                        </div>
                        <div>
                          <span className="radar-legend-dot" style={{ background: "#06b6d4", border: "1px dashed #fff" }}></span>
                          <strong>Global Top 10 Elite Benchmark</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FEATURE 1: INTERACTIVE WHAT-IF KPI SIMULATOR & PREDICTOR */}
                <div className="simulator-panel">
                  <div className="sim-header">
                    <div>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>🔮</span>
                        <span>Strategic "What-If" KPI Simulator & Rank Predictor</span>
                      </h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.84rem", marginTop: "4px" }}>
                        Simulate targeted strategic investments in key CWUR dimensions to predict projected score shifts and global ranking elevation.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="quick-chip"
                        onClick={() => {
                          const baselineAdj = {
                            citations: latestRec.citations || 20,
                            patents: latestRec.patents || 20,
                            quality_of_faculty: latestRec.quality_of_faculty || 15,
                            quality_of_education: latestRec.quality_of_education || 15,
                            publications: latestRec.publications || 20,
                          };
                          setSimAdjustments(baselineAdj);
                          runSimulation(baselineAdj);
                        }}
                      >
                        ↺ Reset to Actuals
                      </button>
                      <button
                        className="search-action-btn"
                        onClick={() => runSimulation()}
                      >
                        {simLoading ? "Simulating..." : "Calculate Predicted Rank"}
                      </button>
                    </div>
                  </div>

                  <div className="sim-grid">
                    {/* Sliders Container */}
                    <div className="sim-sliders-box">
                      {[
                        { key: "citations", label: "Citations Rank", max: 200, actual: latestRec.citations },
                        { key: "patents", label: "Patents Rank", max: 200, actual: latestRec.patents },
                        { key: "quality_of_faculty", label: "Faculty Quality Rank", max: 100, actual: latestRec.quality_of_faculty },
                        { key: "quality_of_education", label: "Education Quality Rank", max: 100, actual: latestRec.quality_of_education },
                        { key: "publications", label: "Publications Rank", max: 200, actual: latestRec.publications },
                      ].map((item) => (
                        <div key={item.key} className="sim-slider-row">
                          <div className="sim-slider-meta">
                            <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{item.label}</span>
                            <span>
                              <span style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginRight: "8px" }}>
                                Actual: #{item.actual || "N/A"}
                              </span>
                              <strong style={{ color: "var(--accent-cyan)" }}>
                                Target: #{simAdjustments[item.key] || item.actual || 20}
                              </strong>
                            </span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max={item.max}
                            className="sim-slider-input"
                            value={simAdjustments[item.key] || item.actual || 20}
                            onChange={(e) => {
                              const updated = { ...simAdjustments, [item.key]: Number(e.target.value) };
                              setSimAdjustments(updated);
                            }}
                            onMouseUp={() => runSimulation()}
                            onTouchEnd={() => runSimulation()}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Simulation Outcome & Prediction */}
                    <div className="sim-prediction-box">
                      <div>
                        <div style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "12px" }}>
                          Predictive Model Output
                        </div>

                        <div className="sim-stat-pair">
                          <div className="sim-stat-card">
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Projected World Rank</div>
                            <div className="sim-stat-val" style={{ color: "#818cf8" }}>
                              #{simulationResult ? simulationResult.predicted_rank : latestRec.world_rank}
                            </div>
                            {simulationResult && (
                              <div
                                className="sim-delta-badge"
                                style={{
                                  background: simulationResult.rank_delta > 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                  color: simulationResult.rank_delta > 0 ? "#34d399" : "#f87171",
                                }}
                              >
                                {simulationResult.rank_delta > 0
                                  ? `▲ +${simulationResult.rank_delta} Gained`
                                  : simulationResult.rank_delta < 0
                                  ? `▼ ${simulationResult.rank_delta} Shift`
                                  : "━ Neutral"}
                              </div>
                            )}
                          </div>

                          <div className="sim-stat-card">
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Simulated Score</div>
                            <div className="sim-stat-val" style={{ color: "var(--accent-cyan)" }}>
                              {simulationResult ? simulationResult.simulated_score.toFixed(1) : latestRec.score.toFixed(1)}
                            </div>
                            {simulationResult && (
                              <div
                                className="sim-delta-badge"
                                style={{
                                  background: simulationResult.score_delta >= 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                                  color: simulationResult.score_delta >= 0 ? "#34d399" : "#f87171",
                                }}
                              >
                                {simulationResult.score_delta >= 0 ? `+${simulationResult.score_delta}` : `${simulationResult.score_delta}`} pts
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: "16px", padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", fontSize: "0.84rem", color: "#cbd5e1", lineHeight: "1.5" }}>
                          {simulationResult ? (
                            <span>💡 {simulationResult.strategic_summary}</span>
                          ) : (
                            <span>Adjust the sliders to project how institutional investments would improve {selectedUniversity}'s global rank.</span>
                          )}
                        </div>
                      </div>

                      <button
                        className="quick-chip"
                        style={{ width: "100%", justifyContent: "center", color: "#c084fc", borderColor: "rgba(192, 132, 252, 0.3)" }}
                        onClick={() => {
                          setChatOpen(true);
                          sendChatMessage(
                            `How can ${selectedUniversity} strategically improve its Citations rank to #${simAdjustments.citations} and Patents rank to #${simAdjustments.patents} to elevate its global standing?`
                          );
                        }}
                      >
                        🤖 Ask AI Advisor to Plan This Target →
                      </button>
                    </div>
                  </div>
                </div>

                {/* Trajectory Timeline & YoY Delta Audit */}
                <div className="dashboard-row" style={{ marginTop: "24px" }}>
                  <div className="panel-card">
                    <div className="panel-title">
                      <span>📈 Historical Trajectory Timeline</span>
                      <span className="badge badge-indigo">2012 — 2015</span>
                    </div>

                    {trendData.length > 0 && (
                      <div className="chart-container">
                        <svg className="chart-svg" viewBox="0 0 500 200">
                          <line x1="40" y1="30" x2="480" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
                          <line x1="40" y1="90" x2="480" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />
                          <line x1="40" y1="150" x2="480" y2="150" stroke="rgba(255,255,255,0.06)" strokeDasharray="4" />

                          {trendData.map((pt, i) => {
                            const stepX = 40 + (i * (440 / Math.max(1, trendData.length - 1)));
                            const maxRank = Math.max(...trendData.map((t) => t.world_rank), 10);
                            const minRank = Math.min(...trendData.map((t) => t.world_rank), 1);
                            const range = Math.max(maxRank - minRank, 1);
                            const normY = 40 + ((pt.world_rank - minRank) / range) * 110;

                            const nextPt = trendData[i + 1];
                            const nextStepX = 40 + ((i + 1) * (440 / Math.max(1, trendData.length - 1)));
                            const nextNormY = nextPt ? 40 + ((nextPt.world_rank - minRank) / range) * 110 : 0;

                            return (
                              <g key={pt.year}>
                                {nextPt && (
                                  <line
                                    x1={stepX}
                                    y1={normY}
                                    x2={nextStepX}
                                    y2={nextNormY}
                                    stroke="url(#lineGrad)"
                                    strokeWidth="3"
                                  />
                                )}
                                <circle cx={stepX} cy={normY} r="6" fill="#6366f1" stroke="#fff" strokeWidth="2" />
                                <text x={stepX} y={normY - 12} fill="#f8fafc" fontSize="11" textAnchor="middle" fontWeight="700">
                                  #{pt.world_rank}
                                </text>
                                <text x={stepX} y="185" fill="#94a3b8" fontSize="12" textAnchor="middle">
                                  {pt.year}
                                </text>
                                <text x={stepX} y={normY + 22} fill="#06b6d4" fontSize="10" textAnchor="middle">
                                  {pt.score.toFixed(1)} pts
                                </text>
                              </g>
                            );
                          })}

                          <defs>
                            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#06b6d4" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Year-over-Year Trajectory Audit Table */}
                  <div className="panel-card">
                    <div className="panel-title">
                      <span>📋 Trajectory Audit</span>
                      <span className="badge badge-indigo">Audit Log</span>
                    </div>

                    <div className="data-table-wrapper">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Year</th>
                            <th>Rank</th>
                            <th>Shift</th>
                            <th>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {trendData.map((row) => (
                            <tr key={row.year}>
                              <td><strong>{row.year}</strong></td>
                              <td>#{row.world_rank}</td>
                              <td>
                                {row.rank_change > 0 ? (
                                  <span className="badge badge-green">▲ +{row.rank_change}</span>
                                ) : row.rank_change < 0 ? (
                                  <span className="badge badge-red">▼ {row.rank_change}</span>
                                ) : (
                                  <span className="badge badge-indigo">━</span>
                                )}
                              </td>
                              <td>{row.score.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* AI Strategic Intelligence Panel */}
                {aiInsight && (
                  <div className="ai-panel animate-fade-in">
                    <div className="ai-header">
                      <div className="ai-title">
                        <span>🤖</span>
                        <span>AI Strategic Performance Advisory</span>
                        <span className="badge badge-indigo">
                          Source: {aiInsight.source}
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          className={`speak-btn ${isSpeaking && currentlySpeakingId === "panel-brief" ? "speaking" : ""}`}
                          onClick={() => speakText(aiInsight.insight, "panel-brief")}
                        >
                          {isSpeaking && currentlySpeakingId === "panel-brief" ? "⏹️ Stop Audio" : "🔊 Read Aloud"}
                        </button>
                        <button className="ai-copy-btn" onClick={handleCopyInsight}>
                          {copiedInsight ? "✓ Copied to Clipboard" : "📋 Copy Executive Brief"}
                        </button>
                        <button
                          className="ai-copy-btn"
                          style={{ background: "rgba(2, 132, 199, 0.2)", borderColor: "rgba(2, 132, 199, 0.5)", color: "#7dd3fc" }}
                          onClick={() => downloadPdf(latestRec.institution)}
                        >
                          {pdfDownloading ? "⏳ Exporting..." : "📄 Export PDF"}
                        </button>
                      </div>
                    </div>

                    <div className="ai-content">
                      {aiInsight.insight}
                    </div>
                  </div>
                )}

                {/* STANDOUT FEATURE 1: STRATEGIC ROI & CAPITAL INVESTMENT ALLOCATION ENGINE */}
                {roiData && (
                  <div className="panel-card roi-section animate-fade-in">
                    <div className="panel-title">
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span>💰</span>
                        <span>Strategic Capital Allocation & Institutional Payback Optimizer</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Capital Tier:</span>
                        <div className="year-btn-group">
                          {[
                            { key: "conservative", label: "$15M Grants" },
                            { key: "moderate", label: "$45M Initiative" },
                            { key: "aggressive", label: "$100M Flagship" }
                          ].map((t) => (
                            <button
                              key={t.key}
                              className={`year-btn ${roiBudgetTier === t.key ? "active" : ""}`}
                              onClick={() => fetchRoiStrategy(t.key)}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                      Algorithmic resource optimization engine calculating capital efficiency across high-leverage CWUR dimensions, projecting ranking elevation, research grant ROI, and endowment payback timelines.
                    </p>

                    {/* KPI Impact Metrics Bar */}
                    <div className="roi-metrics-grid">
                      <div className="roi-stat-card">
                        <span className="roi-stat-label">Capital Allocated</span>
                        <span className="roi-stat-val" style={{ color: "#34d399" }}>
                          ${roiData.budget_usd_m}M USD
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                          {roiData.effort_level}
                        </span>
                      </div>

                      <div className="roi-stat-card">
                        <span className="roi-stat-label">Projected Global Rank</span>
                        <span className="roi-stat-val" style={{ color: "#818cf8" }}>
                          #{roiData.projected_world_rank}
                        </span>
                        <span style={{ fontSize: "0.74rem", color: roiData.rank_elevation > 0 ? "#34d399" : "var(--text-muted)" }}>
                          {roiData.rank_elevation > 0 ? `▲ +${roiData.rank_elevation} ranks elevated` : "Baseline Top Rank"}
                        </span>
                      </div>

                      <div className="roi-stat-card">
                        <span className="roi-stat-label">Projected Score Uplift</span>
                        <span className="roi-stat-val" style={{ color: "var(--accent-cyan)" }}>
                          {roiData.projected_score.toFixed(1)}
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "#34d399" }}>
                          +{roiData.score_gain.toFixed(1)} score points gained
                        </span>
                      </div>

                      <div className="roi-stat-card">
                        <span className="roi-stat-label">Estimated Payback Period</span>
                        <span className="roi-stat-val" style={{ color: "#fbbf24" }}>
                          {roiData.estimated_payback_years} Years
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>
                          +${roiData.estimated_annual_grant_growth_usd_m}M/yr grant & tuition upside
                        </span>
                      </div>
                    </div>

                    {/* Recommended Capital Initiatives */}
                    <div style={{ marginTop: "18px" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>🎯</span>
                        <span>Prioritized High-ROI Strategic Levers</span>
                      </div>

                      <div className="roi-initiatives-grid">
                        {roiData.initiatives.map((init) => (
                          <div key={init.kpi} className="roi-card">
                            <div>
                              <div className="roi-card-header">
                                <span className="roi-card-title">{init.label}</span>
                                <span className="roi-badge-budget">${init.allocated_budget_usd_m}M Budget</span>
                              </div>

                              <div className="roi-shift-meter" style={{ marginTop: "12px" }}>
                                <div>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Current</span>
                                  <strong style={{ color: "#f87171" }}>#{init.current_rank}</strong>
                                </div>
                                <span style={{ color: "#34d399", fontWeight: 700 }}>
                                  → {init.projected_rank_gain > 0 ? `▲ +${init.projected_rank_gain} ranks` : "Maximized"} →
                                </span>
                                <div>
                                  <span style={{ color: "var(--text-muted)", fontSize: "0.75rem", display: "block" }}>Projected</span>
                                  <strong style={{ color: "#34d399" }}>#{init.target_rank}</strong>
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="roi-action-box">
                                <div style={{ fontWeight: 600, color: "#fff", marginBottom: "4px" }}>
                                  Strategic Playbook ({init.implementation_timeline}):
                                </div>
                                {init.action_playbook}
                              </div>

                              <button
                                className="quick-chip"
                                style={{ width: "100%", marginTop: "10px", justifyContent: "center", fontSize: "0.78rem" }}
                                onClick={() => {
                                  setChatOpen(true);
                                  sendChatMessage(
                                    `Draft a detailed capital allocation blueprint for ${latestRec.institution} allocating $${init.allocated_budget_usd_m}M to "${init.label}" to compress rank from #${init.current_rank} to #${init.target_rank}.`
                                  );
                                }}
                              >
                                🤖 Ask Advisor for Implementation Roadmap →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="loading-box">
                <p>No university selected. Search above to begin analysis.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 2: OVERVIEW & COUNTRY POWER INDEX ================= */}
        {activeTab === "overview" && stats && (
          <div className="animate-fade-in">
            {/* Macro KPI Cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">
                  <span>TOTAL DATASET RECORDS</span>
                  <div className="metric-icon-box" style={{ background: "rgba(99, 102, 241, 0.15)", color: "#818cf8" }}>
                    📚
                  </div>
                </div>
                <div className="metric-value">{stats.total_records.toLocaleString()}</div>
                <div className="metric-subtext">Verified CWUR benchmark observations</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span>INDEXED UNIVERSITIES</span>
                  <div className="metric-icon-box" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#34d399" }}>
                    🏛️
                  </div>
                </div>
                <div className="metric-value">{stats.total_universities.toLocaleString()}</div>
                <div className="metric-subtext">Distinct higher-ed institutions tracked</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span>COUNTRIES COVERED</span>
                  <div className="metric-icon-box" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#22d3ee" }}>
                    🌍
                  </div>
                </div>
                <div className="metric-value">{stats.total_countries}</div>
                <div className="metric-subtext">Global sovereign territories</div>
              </div>

              <div className="metric-card">
                <div className="metric-header">
                  <span>HISTORICAL CYCLES</span>
                  <div className="metric-icon-box" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
                    📅
                  </div>
                </div>
                <div className="metric-value">{stats.years.join(" — ")}</div>
                <div className="metric-subtext">Multi-year longitudinal analytics</div>
              </div>
            </div>

            {/* Overview Detail Grid */}
            <div className="dashboard-row">
              {/* Top 10 World Universities Leaderboard */}
              <div className="panel-card">
                <div className="panel-title">
                  <span>🏆 Global Elite Leaderboard (Top 10)</span>
                  <span className="badge badge-indigo">Latest Cycle</span>
                </div>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Institution</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.top_institutions?.map((inst, index) => (
                        <tr key={inst}>
                          <td>
                            <span className={`rank-badge ${index === 0 ? "rank-top1" : index < 3 ? "rank-top3" : "rank-default"}`}>
                              #{index + 1}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{inst}</td>
                          <td>
                            <button
                              className="quick-chip"
                              onClick={() => loadUniversity(inst)}
                            >
                              Analyze Deep-Dive →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Score Tier Distribution */}
              <div className="panel-card">
                <div className="panel-title">
                  <span>🎯 Score Tier Distribution</span>
                  <span className="badge badge-indigo">CWUR Scale</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
                  Distribution of university records across overall score brackets.
                </p>

                {Object.entries(stats.score_distribution || {}).map(([bracket, count]) => {
                  const pct = ((count / stats.total_records) * 100).toFixed(1);
                  return (
                    <div key={bracket} className="dist-item">
                      <div className="dist-meta">
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{bracket}</span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="dist-bar-track">
                        <div className="dist-bar-fill" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FEATURE 3: GLOBAL ACADEMIC COUNTRY POWER INDEX */}
            <div className="country-power-section">
              <div className="panel-card">
                <div className="panel-title">
                  <span>🗺️ Global Academic Country Power Index (59 Sovereign Nations)</span>
                  <span className="badge badge-indigo">Sovereign Higher-Ed Capacity</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "20px" }}>
                  Evaluates international higher-education capacity based on Top 100 representation, total research universities, and aggregate performance.
                </p>

                {/* Top 3 Country Podium */}
                {countryPowerIndex.length >= 3 && (
                  <div className="country-podium-grid">
                    <div className="podium-card" style={{ borderColor: "rgba(251, 191, 36, 0.4)" }}>
                      <div className="podium-rank">🥇 Rank #1</div>
                      <div className="podium-country">{countryPowerIndex[0].country}</div>
                      <div className="podium-meta">
                        <div>🏛️ Ranked Institutions: <strong>{countryPowerIndex[0].total_institutions}</strong></div>
                        <div>⭐ Top 100 Global Share: <strong>{countryPowerIndex[0].top_100_count} universities</strong></div>
                        <div>🏆 Top Institution: <strong>{countryPowerIndex[0].top_institution} (#{countryPowerIndex[0].top_rank})</strong></div>
                        <div style={{ marginTop: "4px", color: "#fbbf24", fontWeight: 700 }}>Power Rating: {countryPowerIndex[0].power_score} pts</div>
                      </div>
                    </div>

                    <div className="podium-card" style={{ borderColor: "rgba(148, 163, 184, 0.4)" }}>
                      <div className="podium-rank" style={{ color: "#94a3b8" }}>🥈 Rank #2</div>
                      <div className="podium-country">{countryPowerIndex[1].country}</div>
                      <div className="podium-meta">
                        <div>🏛️ Ranked Institutions: <strong>{countryPowerIndex[1].total_institutions}</strong></div>
                        <div>⭐ Top 100 Global Share: <strong>{countryPowerIndex[1].top_100_count} universities</strong></div>
                        <div>🏆 Top Institution: <strong>{countryPowerIndex[1].top_institution} (#{countryPowerIndex[1].top_rank})</strong></div>
                        <div style={{ marginTop: "4px", color: "#94a3b8", fontWeight: 700 }}>Power Rating: {countryPowerIndex[1].power_score} pts</div>
                      </div>
                    </div>

                    <div className="podium-card" style={{ borderColor: "rgba(217, 119, 6, 0.4)" }}>
                      <div className="podium-rank" style={{ color: "#d97706" }}>🥉 Rank #3</div>
                      <div className="podium-country">{countryPowerIndex[2].country}</div>
                      <div className="podium-meta">
                        <div>🏛️ Ranked Institutions: <strong>{countryPowerIndex[2].total_institutions}</strong></div>
                        <div>⭐ Top 100 Global Share: <strong>{countryPowerIndex[2].top_100_count} universities</strong></div>
                        <div>🏆 Top Institution: <strong>{countryPowerIndex[2].top_institution} (#{countryPowerIndex[2].top_rank})</strong></div>
                        <div style={{ marginTop: "4px", color: "#d97706", fontWeight: 700 }}>Power Rating: {countryPowerIndex[2].power_score} pts</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Country Power Table */}
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Power Rank</th>
                        <th>Country</th>
                        <th>Total Ranked</th>
                        <th>Top 100 Share</th>
                        <th>Average Score</th>
                        <th>Top National Institution</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {countryPowerIndex.slice(0, 15).map((cp, idx) => (
                        <tr key={cp.country}>
                          <td><strong>#{idx + 1}</strong></td>
                          <td style={{ fontWeight: 700 }}>📍 {cp.country}</td>
                          <td>{cp.total_institutions}</td>
                          <td>
                            {cp.top_100_count > 0 ? (
                              <span className="badge badge-green">{cp.top_100_count} in Top 100</span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>0</span>
                            )}
                          </td>
                          <td>{cp.average_score.toFixed(1)}</td>
                          <td>{cp.top_institution} (#{cp.top_rank})</td>
                          <td>
                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                className="quick-chip"
                                onClick={() => selectGeoCountry(cp.country)}
                              >
                                {selectedGeoCountry === cp.country ? "Close Hub ✕" : "Inspect Hub 🔍"}
                              </button>
                              <button
                                className="quick-chip"
                                style={{ color: "#38bdf8" }}
                                onClick={() => {
                                  setRankingsCountry(cp.country);
                                  setActiveTab("rankings");
                                }}
                              >
                                Directory →
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* STANDOUT FEATURE 2: INTERACTIVE GEOGRAPHIC ACADEMIC HUB DRAWER */}
                {selectedGeoCountry && (
                  <div className="geo-drawer animate-fade-in">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                      <div>
                        <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>📍</span>
                          <span>{selectedGeoCountry} Higher-Ed Ecosystem Intelligence</span>
                          <span className="badge badge-indigo">Direct Sovereign Audit</span>
                        </h4>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", marginTop: "2px" }}>
                          Real-time breakdown of leading academic institutions, quality of education, and research performance in {selectedGeoCountry}.
                        </p>
                      </div>
                      <button
                        className="quick-chip"
                        onClick={() => setSelectedGeoCountry(null)}
                      >
                        ✕ Close Drawer
                      </button>
                    </div>

                    {geoLoading ? (
                      <div className="loading-box" style={{ padding: "20px" }}>
                        <div className="spinner" style={{ width: "24px", height: "24px" }}></div>
                        <p style={{ fontSize: "0.85rem" }}>Loading {selectedGeoCountry} institutions...</p>
                      </div>
                    ) : geoCountryData?.results ? (
                      <div className="data-table-wrapper">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>World Rank</th>
                              <th>Institution</th>
                              <th>Score</th>
                              <th>Education Rank</th>
                              <th>Faculty Rank</th>
                              <th>Publications</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {geoCountryData.results.map((u) => (
                              <tr key={u.institution}>
                                <td><span className="rank-badge rank-top3">#{u.world_rank}</span></td>
                                <td style={{ fontWeight: 600 }}>{u.institution}</td>
                                <td style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{u.score.toFixed(1)}</td>
                                <td>{u.quality_of_education ? `#${u.quality_of_education}` : "—"}</td>
                                <td>{u.quality_of_faculty ? `#${u.quality_of_faculty}` : "—"}</td>
                                <td>{u.publications ? `#${u.publications}` : "—"}</td>
                                <td>
                                  <button
                                    className="quick-chip"
                                    onClick={() => loadUniversity(u.institution)}
                                  >
                                    Deep-Dive →
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 3: HEAD-TO-HEAD COMPARISON ================= */}
        {activeTab === "compare" && (
          <div className="animate-fade-in">
            <div className="panel-card" style={{ marginBottom: "24px" }}>
              <div className="panel-title">
                <span>⚔️ Comparative Institutional Benchmarking</span>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Evaluation Cycle:</label>
                  <div className="year-btn-group">
                    {[2015, 2014, 2013, 2012].map((y) => (
                      <button
                        key={y}
                        className={`year-btn ${compareYear === y ? "active" : ""}`}
                        onClick={() => setCompareYear(y)}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Institution Selectors */}
              <div className="compare-selector-bar">
                <div className="compare-inst-box">
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Primary University
                  </label>
                  <input
                    type="text"
                    className="compare-input"
                    value={compareInst1}
                    onChange={(e) => setCompareInst1(e.target.value)}
                    onBlur={() => runComparison(compareInst1, compareInst2, compareYear)}
                    placeholder="Enter Institution 1"
                  />
                </div>

                <div className="compare-vs-badge">VS</div>

                <div className="compare-inst-box">
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Benchmark Competitor
                  </label>
                  <input
                    type="text"
                    className="compare-input"
                    value={compareInst2}
                    onChange={(e) => setCompareInst2(e.target.value)}
                    onBlur={() => runComparison(compareInst1, compareInst2, compareYear)}
                    placeholder="Enter Institution 2"
                  />
                </div>
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  className="search-action-btn"
                  onClick={() => runComparison(compareInst1, compareInst2, compareYear)}
                >
                  Recalculate Head-to-Head Benchmarks
                </button>
              </div>
            </div>

            {compareLoading ? (
              <div className="loading-box">
                <div className="spinner"></div>
                <p>Computing Head-to-Head Metric Deltas...</p>
              </div>
            ) : comparisonData ? (
              <div className="panel-card animate-fade-in">
                {/* Header Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                  <div style={{ background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <h3 style={{ color: "#a5b4fc", fontSize: "1.2rem" }}>{comparisonData.inst1}</h3>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
                      World #{comparisonData.inst1_rank}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Score: {comparisonData.inst1_score.toFixed(1)} / 100
                    </div>
                  </div>

                  <div style={{ background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.3)", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                    <h3 style={{ color: "#67e8f9", fontSize: "1.2rem" }}>{comparisonData.inst2}</h3>
                    <div style={{ fontSize: "1.6rem", fontWeight: 800, marginTop: "6px" }}>
                      World #{comparisonData.inst2_rank}
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      Score: {comparisonData.inst2_score.toFixed(1)} / 100
                    </div>
                  </div>
                </div>

                {/* Dimension Comparison Matrix */}
                <div className="panel-title">
                  <span>📊 KPI Dimension Comparison Matrix</span>
                  <span className="badge badge-indigo">Cycle {comparisonData.year}</span>
                </div>

                <div className="data-table-wrapper">
                  <div className="dimension-row" style={{ fontWeight: 700, background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--border)" }}>
                    <div>KPI Dimension</div>
                    <div>{comparisonData.inst1}</div>
                    <div>{comparisonData.inst2}</div>
                    <div>Competitive Advantage</div>
                  </div>

                  {comparisonData.dimensions?.map((dim) => (
                    <div key={dim.kpi} className="dimension-row">
                      <div style={{ fontWeight: 600, color: "#fff" }}>
                        {dim.label}
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                          {dim.is_rank_based ? "Lower is better" : "Higher is better"}
                        </span>
                      </div>
                      <div style={{ color: dim.winner === comparisonData.inst1 ? "#34d399" : "var(--text-primary)", fontWeight: 600 }}>
                        {dim.inst1_val !== null ? (dim.is_rank_based ? `#${Math.round(dim.inst1_val)}` : dim.inst1_val.toFixed(1)) : "—"}
                      </div>
                      <div style={{ color: dim.winner === comparisonData.inst2 ? "#34d399" : "var(--text-primary)", fontWeight: 600 }}>
                        {dim.inst2_val !== null ? (dim.is_rank_based ? `#${Math.round(dim.inst2_val)}` : dim.inst2_val.toFixed(1)) : "—"}
                      </div>
                      <div>
                        {dim.winner === comparisonData.inst1 ? (
                          <span className="winner-pill winner-inst1">🏆 {comparisonData.inst1}</span>
                        ) : dim.winner === comparisonData.inst2 ? (
                          <span className="winner-pill winner-inst2">🏆 {comparisonData.inst2}</span>
                        ) : (
                          <span className="winner-pill" style={{ background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>
                            Tie / Balanced
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* STANDOUT FEATURE 3: MULTI-INSTITUTION BENCHMARK SHORTLIST & COMPARATIVE MATRIX */}
            <div className="panel-card benchmark-matrix-card animate-fade-in">
              <div className="panel-title">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>📋</span>
                  <span>Multi-Institution Benchmark Shortlist ({shortlist.length} Selected)</span>
                </div>
                <span className="badge badge-indigo">Multi-Peer Matrix</span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "16px" }}>
                Add or remove universities across the platform to evaluate head-to-head multi-peer institutional competitiveness side-by-side.
              </p>

              {/* Shortlist Chips Bar */}
              <div className="shortlist-bar">
                <div className="shortlist-chips">
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginRight: "4px" }}>Peer Set:</span>
                  {shortlist.map((inst) => (
                    <span key={inst} className="shortlist-tag">
                      <span>🏛️ {inst.replace("University of ", "").replace(" University", "")}</span>
                      <button
                        className="shortlist-remove"
                        onClick={() => toggleShortlistInstitution(inst)}
                        title="Remove from shortlist"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <button
                  className="quick-chip"
                  onClick={() => refreshShortlistMatrix()}
                  disabled={shortlistLoading}
                >
                  {shortlistLoading ? "Refreshing..." : "🔄 Refresh Peer Matrix"}
                </button>
              </div>

              {/* Matrix Table */}
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Institution</th>
                      <th>Country</th>
                      <th>World Rank</th>
                      <th>Overall Score</th>
                      <th>Education Rank</th>
                      <th>Faculty Rank</th>
                      <th>Publications</th>
                      <th>Citations</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortlistMatrix.map((item) => (
                      <tr key={item.institution}>
                        <td style={{ fontWeight: 700, color: "#fff" }}>{item.institution}</td>
                        <td>📍 {item.country}</td>
                        <td>
                          <span className={`rank-badge ${item.world_rank <= 3 ? "rank-top1" : item.world_rank <= 10 ? "rank-top3" : "rank-default"}`}>
                            #{item.world_rank}
                          </span>
                        </td>
                        <td style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>{item.score.toFixed(1)}</td>
                        <td>{item.quality_of_education ? `#${item.quality_of_education}` : "—"}</td>
                        <td>{item.quality_of_faculty ? `#${item.quality_of_faculty}` : "—"}</td>
                        <td>{item.publications ? `#${item.publications}` : "—"}</td>
                        <td>{item.citations ? `#${item.citations}` : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              className="quick-chip"
                              onClick={() => loadUniversity(item.institution)}
                            >
                              Deep-Dive →
                            </button>
                            <button
                              className="quick-chip"
                              style={{ color: "#f87171" }}
                              onClick={() => toggleShortlistInstitution(item.institution)}
                            >
                              Remove ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 4: GLOBAL RANKINGS EXPLORER DIRECTORY ================= */}
        {activeTab === "rankings" && (
          <div className="animate-fade-in">
            {/* Filter Controls Bar */}
            <div className="filter-bar">
              <div className="filter-group">
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Year:</span>
                <div className="year-btn-group">
                  {[2015, 2014, 2013, 2012].map((y) => (
                    <button
                      key={y}
                      className={`year-btn ${rankingsYear === y ? "active" : ""}`}
                      onClick={() => {
                        setRankingsYear(y);
                        setRankingsPage(1);
                      }}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Country:</label>
                <select
                  className="filter-select"
                  value={rankingsCountry}
                  onChange={(e) => {
                    setRankingsCountry(e.target.value);
                    setRankingsPage(1);
                  }}
                >
                  <option value="">All Countries ({countriesList.length})</option>
                  {countriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>Sort By:</label>
                <select
                  className="filter-select"
                  value={rankingsSortBy}
                  onChange={(e) => setRankingsSortBy(e.target.value)}
                >
                  <option value="world_rank">World Rank</option>
                  <option value="score">Overall Score</option>
                  <option value="quality_of_education">Quality of Education</option>
                  <option value="quality_of_faculty">Quality of Faculty</option>
                  <option value="publications">Publications</option>
                  <option value="citations">Citations</option>
                  <option value="patents">Patents</option>
                </select>

                <button
                  className="page-btn"
                  onClick={() => setRankingsOrder(rankingsOrder === "asc" ? "desc" : "asc")}
                >
                  {rankingsOrder === "asc" ? "▲ Asc" : "▼ Desc"}
                </button>
              </div>
            </div>

            {/* Rankings Data Table */}
            <div className="panel-card">
              <div className="panel-title">
                <span>🌍 Global University Directory ({rankingsData ? rankingsData.total : "..."} records)</span>
                <span className="badge badge-indigo">
                  Page {rankingsPage} of {rankingsData ? rankingsData.total_pages : 1}
                </span>
              </div>

              {rankingsLoading ? (
                <div className="loading-box">
                  <div className="spinner"></div>
                  <p>Filtering Global Directory...</p>
                </div>
              ) : rankingsData ? (
                <div>
                  <div className="data-table-wrapper">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Institution</th>
                          <th>Country</th>
                          <th>Score</th>
                          <th>Education</th>
                          <th>Faculty</th>
                          <th>Publications</th>
                          <th>Citations</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankingsData.results.map((row) => (
                          <tr key={`${row.institution}-${row.year}`}>
                            <td>
                              <span className={`rank-badge ${row.world_rank === 1 ? "rank-top1" : row.world_rank <= 3 ? "rank-top3" : "rank-default"}`}>
                                #{row.world_rank}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{row.institution}</td>
                            <td>📍 {row.country}</td>
                            <td>
                              <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
                                {row.score.toFixed(1)}
                              </span>
                            </td>
                            <td>{row.quality_of_education ? `#${row.quality_of_education}` : "—"}</td>
                            <td>{row.quality_of_faculty ? `#${row.quality_of_faculty}` : "—"}</td>
                            <td>{row.publications ? `#${row.publications}` : "—"}</td>
                            <td>{row.citations ? `#${row.citations}` : "—"}</td>
                            <td>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button
                                  className="quick-chip"
                                  onClick={() => loadUniversity(row.institution)}
                                >
                                  Deep-Dive →
                                </button>
                                <button
                                  className="quick-chip"
                                  style={{ color: shortlist.includes(row.institution) ? "#fbbf24" : "var(--text-secondary)" }}
                                  onClick={() => toggleShortlistInstitution(row.institution)}
                                  title={shortlist.includes(row.institution) ? "Remove from benchmark shortlist" : "Add to benchmark shortlist"}
                                >
                                  {shortlist.includes(row.institution) ? "★ Shortlisted" : "+ Shortlist"}
                                </button>
                                <button
                                  className="quick-chip"
                                  style={{ color: "#38bdf8" }}
                                  onClick={() => downloadPdf(row.institution)}
                                >
                                  📄 PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="pagination-bar">
                    <div>
                      Showing {((rankingsPage - 1) * 15) + 1} to {Math.min(rankingsPage * 15, rankingsData.total)} of {rankingsData.total} universities
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="page-btn"
                        disabled={rankingsPage <= 1}
                        onClick={() => setRankingsPage((p) => Math.max(1, p - 1))}
                      >
                        ← Previous
                      </button>
                      <button
                        className="page-btn"
                        disabled={rankingsPage >= rankingsData.total_pages}
                        onClick={() => setRankingsPage((p) => p + 1)}
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* Floating Chatbot Launcher Button */}
      <button
        className="floating-chat-btn"
        onClick={() => setChatOpen(!chatOpen)}
        title="Open AI Strategic Performance Advisor"
      >
        <span className="chat-badge-pulse"></span>
        <span>💬 AI Strategic Advisor</span>
      </button>

      {/* Interactive AI Chatbot Window Drawer */}
      {chatOpen && (
        <div className="chat-drawer">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-title">
              <span>🤖</span>
              <div>
                <div>KPI Strategic Advisor</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", fontWeight: 400 }}>
                  Active Academic Intelligence
                </div>
              </div>
            </div>

            <div className="chat-header-actions">
              {/* Hands-Free Voice Mode Toggle */}
              <div
                className={`voice-mode-toggle ${voiceModeActive ? "active" : ""}`}
                onClick={() => setVoiceModeActive(!voiceModeActive)}
                title="Toggle automatic spoken responses"
              >
                <span className="voice-mode-indicator"></span>
                <span>{voiceModeActive ? "🎙️ Voice: ON" : "🎙️ Voice: OFF"}</span>
              </div>

              <button
                className="chat-action-icon"
                title="Clear conversation"
                onClick={() => {
                  stopSpeaking();
                  setChatMessages([
                    {
                      role: "assistant",
                      content: `Hello! I am your University KPI Strategic Advisor. How can I assist you with analyzing ${selectedUniversity || "global universities"} today?`,
                      source: "AI Strategic Advisor"
                    }
                  ]);
                }}
              >
                🗑️
              </button>
              <button
                className="chat-action-icon"
                title="Close chat"
                onClick={() => {
                  stopSpeaking();
                  setChatOpen(false);
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Active University Context Banner */}
          {selectedUniversity && (
            <div className="chat-context-banner">
              <span>📍 Focus Context: <strong>{selectedUniversity}</strong></span>
              <span style={{ fontSize: "0.72rem", opacity: 0.8 }}>CWUR Dataset Grounded</span>
            </div>
          )}

          {/* Messages Timeline */}
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                <div style={{ whiteSpace: "pre-line" }}>{msg.content}</div>

                {msg.role === "assistant" && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                    {msg.source && (
                      <span className="chat-bubble-source">Source: {msg.source}</span>
                    )}
                    <button
                      className={`speak-btn ${isSpeaking && currentlySpeakingId === `chat-${i}` ? "speaking" : ""}`}
                      onClick={() => speakText(msg.content, `chat-${i}`)}
                    >
                      {isSpeaking && currentlySpeakingId === `chat-${i}` ? "⏹️ Stop" : "🔊 Listen"}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="chat-bubble assistant" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div className="spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }}></div>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                  Analyzing dataset & computing strategic insights...
                </span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="chat-quick-prompts">
            {[
              `What are ${selectedUniversity ? selectedUniversity.split(" ")[0] : "Harvard"}'s weaknesses?`,
              `Compare with Stanford`,
              `How can we improve citations?`,
              `Summarize trajectory trend`
            ].map((promptText, i) => (
              <button
                key={i}
                className="chat-prompt-pill"
                onClick={() => sendChatMessage(promptText)}
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Input Bar with Mic & Send Buttons */}
          <form
            className="chat-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              sendChatMessage();
            }}
          >
            {/* Chatbot Microphone Button */}
            <button
              type="button"
              className={`mic-btn ${isListening && listeningTarget === "chat" ? "listening" : ""}`}
              onClick={() => toggleListening("chat")}
              title={isListening && listeningTarget === "chat" ? "Listening... Click to stop" : "Speak your message"}
            >
              {isListening && listeningTarget === "chat" ? (
                <div className="waveform-container">
                  <span className="waveform-bar"></span>
                  <span className="waveform-bar"></span>
                  <span className="waveform-bar"></span>
                  <span className="waveform-bar"></span>
                </div>
              ) : (
                "🎙️"
              )}
            </button>

            <input
              type="text"
              className="chat-input-field"
              placeholder={`Ask or speak about ${selectedUniversity || "any university"}...`}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!chatInput.trim() || chatLoading}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        University KPI Intelligence Agent • Enterprise Academic Analytics Platform • Powered by CWUR Benchmark Data & Google Gemini
      </footer>
    </div>
  );
}