import { useEffect, useState } from "react";

function App() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [university, setUniversity] = useState("");
const [universityData, setUniversityData] = useState([]);
const [trendData, setTrendData] = useState([]);
const [healthData, setHealthData] = useState(null);
const [aiInsight, setAiInsight] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/stats")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend connection failed");
        }
        return response.json();
      })
      .then((data) => {
        setStats(data);
      })
      .catch(() => {
        setError("Unable to connect to University KPI Agent backend");
      });
  }, []);

const searchUniversity = () => {
  if (!university.trim()) {
    return;
  }

  fetch(
    `http://127.0.0.1:8000/university/${encodeURIComponent(
      university
    )}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        setUniversityData([]);
        setTrendData([]);
        setHealthData(null);
        setError(data.message);
        return;
      }

      setUniversityData(data);
      setError("");

      return Promise.all([
    fetch(
      `http://127.0.0.1:8000/university/${encodeURIComponent(
        university
      )}/trend`
    ).then((response) => response.json()),

    fetch(
      `http://127.0.0.1:8000/health/${encodeURIComponent(
        university
      )}`
    ).then((response) => response.json()),

    fetch(
      `http://127.0.0.1:8000/ai-insight/${encodeURIComponent(
        university
      )}`
    ).then((response) => response.json()),
  ]);
    })
    .then((results) => {
      if (results) {
        setTrendData(results[0]);
        setHealthData(results[1]);
        setAiInsight(results[2].insight);
      }
    })
    .catch(() => {
      setError("Unable to search university");
    });
};

  return (
    <div
      style={{
        fontFamily: "Arial",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          background: "#1e293b",
          color: "white",
          padding: "25px 40px",
        }}
      >
        <h1 style={{ margin: 0 }}>
          University KPI Intelligence Agent
        </h1>

        <p style={{ color: "#cbd5e1" }}>
          AI-Powered University Performance Monitoring System
        </p>
      </header>

      <main style={{ padding: "30px 40px" }}>
        <h2>University Performance Overview</h2>
        <div style={{ marginTop: "20px" }}>
 <input
  type="text"
  placeholder="Enter university name"
  value={university}
  onChange={(e) => setUniversity(e.target.value)}
    style={{
      padding: "12px",
      width: "350px",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "16px",
    }}
  />

  <button
    onClick={searchUniversity}
    style={{
      marginLeft: "10px",
      padding: "12px 20px",
      borderRadius: "8px",
      border: "none",
      background: "#2563eb",
      color: "white",
      fontSize: "16px",
      cursor: "pointer",
    }}
  >
    Search
  </button>
</div>

        {error && (
          <p style={{ color: "red" }}>
            {error}
          </p>
        )}

       {universityData.length > 0 && (
  <div
    style={{
      marginTop: "25px",
      background: "white",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    <h2>{universityData[0].institution}</h2>

    {universityData.map((item) => (
      <div
        key={item.year}
        style={{
          borderTop: "1px solid #ddd",
          padding: "15px 0",
        }}
      >
        <h3>Year: {item.year}</h3>

        <p>World Rank: {item.world_rank}</p>
        <p>Score: {item.score}</p>
        <p>Quality of Education: {item.quality_of_education}</p>
        <p>Quality of Faculty: {item.quality_of_faculty}</p>
        <p>Publications: {item.publications}</p>
        <p>Citations: {item.citations}</p>
        <p>Patents: {item.patents}</p>
      </div>
    ))}
  </div>
)}

{healthData && (
  <section
    style={{
      background: "white",
      marginTop: "25px",
      padding: "25px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    <h2>🏥 University Health Status</h2>

    <h3>{healthData.institution}</h3>

    <p>
      <strong>Latest Year:</strong> {healthData.year}
    </p>

    <p>
      <strong>World Rank:</strong> {healthData.world_rank}
    </p>

    <p>
      <strong>Score:</strong> {healthData.score}
    </p>

    <p>
      <strong>Status:</strong>{" "}
      <span
        style={{
          fontWeight: "bold",
          fontSize: "20px",
        }}
      >
        {healthData.status}
      </span>
    </p>
  </section>
)}

{trendData.length > 0 && (
  <section
    style={{
      background: "white",
      marginTop: "25px",
      padding: "25px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}
  >
    <h2>📈 Performance Trend</h2>

   

    {trendData.map((item) => (
      <div
        key={item.year}
        style={{
          padding: "15px 0",
          borderBottom: "1px solid #ddd",
        }}
      >
        <h3>{item.year}</h3>

        <p>
          <strong>World Rank:</strong> {item.world_rank}
        </p>

        <p>
          <strong>Score:</strong> {item.score}
        </p>

        <p>
          <strong>Rank Change:</strong>{" "}
          {item.rank_change > 0
            ? `Improved by ${item.rank_change}`
            : item.rank_change < 0
            ? `Dropped by ${Math.abs(item.rank_change)}`
            : "No Change"}
        </p>

        <p>
          <strong>Score Change:</strong>{" "}
          {item.score_change > 0
            ? `+${item.score_change}`
            : item.score_change}
        </p>
      </div>
    ))}
  </section>
)}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div style={cardStyle}>
            <h3>Total Records</h3>
            <h1>{stats ? stats.total_records : "Loading..."}</h1>
            <p>Dataset Records</p>
          </div>

          <div style={cardStyle}>
            <h3>Universities</h3>
            <h1>
              {stats ? stats.total_universities : "Loading..."}
            </h1>
            <p>Unique Institutions</p>
          </div>

          <div style={cardStyle}>
            <h3>Countries</h3>
            <h1>
              {stats ? stats.total_countries : "Loading..."}
            </h1>
            <p>Countries Covered</p>
          </div>

          <div style={cardStyle}>
            <h3>Years Covered</h3>
            <h1>
              {stats ? stats.years.length : "Loading..."}
            </h1>
            <p>2012 - 2015</p>
          </div>
        </div>

        <section style={sectionStyle}>
          <h2>Dataset Monitoring</h2>

          {stats && (
            <div>
              <p>
                <strong>Available Years:</strong>{" "}
                {stats.years.join(", ")}
              </p>

              <p>
                <strong>Total Records:</strong>{" "}
                {stats.total_records}
              </p>

              <p>
                <strong>Universities:</strong>{" "}
                {stats.total_universities}
              </p>

              <p>
                <strong>Countries:</strong>{" "}
                {stats.total_countries}
              </p>
            </div>
          )}
        </section>

      {aiInsight && (
  <section
    style={{
      background: "#0a5db0",
      marginTop: "25px",
      padding: "25px",
      borderRadius: "12px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      borderLeft: "5px solid #2563eb",
    }}
  >
    <h2>🤖 AI Performance Analysis</h2>

    <p
      style={{
        whiteSpace: "pre-line",
        lineHeight: "1.7",
        fontSize: "16px",
      }}
    >
      {aiInsight}
    </p>
  </section>
)}
      </main>
    </div>
  );
}

const cardStyle = {
  background: "white",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

const sectionStyle = {
  background: "white",
  marginTop: "30px",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

export default App;