/**
 * Energy News Page
 * Displays top 15 energy news stories from scraped sources
 */

import React, { useState, useEffect } from "react";
import {
  Newspaper,
  Clock,
  TrendingUp,
  Filter,
  RefreshCw,
  ExternalLink,
  Zap,
  Share2,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import {
  getTopEnergyNews,
  getAvailableTopics,
  getAvailableEquipment,
  getNewsStats,
  type EnergyNewsStory,
} from "@/services/energyNewsService";

const DARK = {
  bg: "#080b14",
  panel: "#0f1421",
  border: "#1e2738",
  text: "#e2e8f0",
  textSecondary: "#94a3b8",
  accent: "#3ecf8e",
};

// Decode HTML entities (e.g., &#8217; → ')
function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

export default function EnergyNews() {
  const [stories, setStories] = useState<EnergyNewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<"today" | "week" | "month">("today");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [stats, setStats] = useState({
    totalToday: 0,
    totalWeek: 0,
    totalMonth: 0,
    lastScraped: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [copiedStoryId, setCopiedStoryId] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadNews();
    loadFilters();
    loadStats();
  }, [dateRange, selectedTopics, selectedEquipment]);

  async function loadNews() {
    setLoading(true);
    try {
      const newsStories = await getTopEnergyNews({
        dateRange,
        topics: selectedTopics.length > 0 ? selectedTopics : undefined,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        limit: 15,
      });
      setStories(newsStories);
    } catch (error) {
      console.error("Failed to load energy news:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFilters() {
    const [topics, equipment] = await Promise.all([getAvailableTopics(), getAvailableEquipment()]);
    setAvailableTopics(topics);
    setAvailableEquipment(equipment);
  }

  async function loadStats() {
    const newsStats = await getNewsStats();
    setStats(newsStats);
  }

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  function toggleEquipment(eq: string) {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    );
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (hours < 1) return "Just now";
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }

  function copyArticleForSocialMedia(story: EnergyNewsStory) {
    // Format content for social media
    const socialMediaPost = `
🔋 ${decodeHTMLEntities(story.title)}

${story.subtitle ? decodeHTMLEntities(story.subtitle) : ""}

${story.content ? decodeHTMLEntities(story.content) : decodeHTMLEntities(story.summary)}

🔗 Read more: ${story.url}

${story.topics.length > 0 ? `#${story.topics.map((t) => t.replace(/\s+/g, "")).join(" #")}` : ""}
    `.trim();

    navigator.clipboard.writeText(socialMediaPost);
    setCopiedStoryId(story.id);
    setTimeout(() => setCopiedStoryId(null), 2000);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: DARK.bg,
        color: DARK.text,
        paddingTop: 80,
        paddingBottom: 80,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Newspaper size={32} color={DARK.accent} />
              <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>Energy Newsletter</h1>
            </div>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                background: DARK.panel,
                border: `1px solid ${DARK.border}`,
                borderRadius: 8,
                color: DARK.text,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = DARK.accent;
                e.currentTarget.style.color = DARK.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = DARK.border;
                e.currentTarget.style.color = DARK.text;
              }}
            >
              ← Back to Home
            </a>
          </div>
          <p style={{ fontSize: 16, color: DARK.textSecondary, margin: 0 }}>
            Top 15 stories from {stats.totalToday} articles scraped today · Last updated{" "}
            {formatTimeAgo(stats.lastScraped)}
          </p>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 32,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Date Range Selector */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["today", "week", "month"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: `1px solid ${dateRange === range ? DARK.accent : DARK.border}`,
                  background: dateRange === range ? `${DARK.accent}15` : DARK.panel,
                  color: dateRange === range ? DARK.accent : DARK.textSecondary,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: "capitalize",
                }}
              >
                {range === "today" && `Today (${stats.totalToday})`}
                {range === "week" && `Week (${stats.totalWeek})`}
                {range === "month" && `Month (${stats.totalMonth})`}
              </button>
            ))}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${DARK.border}`,
              background: showFilters ? `${DARK.accent}15` : DARK.panel,
              color: showFilters ? DARK.accent : DARK.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Filter size={16} />
            Filters{" "}
            {selectedTopics.length + selectedEquipment.length > 0 &&
              `(${selectedTopics.length + selectedEquipment.length})`}
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              loadNews();
              loadStats();
            }}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${DARK.border}`,
              background: DARK.panel,
              color: DARK.text,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div
            style={{
              background: DARK.panel,
              border: `1px solid ${DARK.border}`,
              borderRadius: 12,
              padding: 24,
              marginBottom: 32,
            }}
          >
            {/* Topics */}
            <div style={{ marginBottom: 24 }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: DARK.textSecondary,
                }}
              >
                Topics
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availableTopics.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: `1px solid ${selectedTopics.includes(topic) ? DARK.accent : DARK.border}`,
                      background: selectedTopics.includes(topic)
                        ? `${DARK.accent}15`
                        : "transparent",
                      color: selectedTopics.includes(topic) ? DARK.accent : DARK.textSecondary,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 12,
                  color: DARK.textSecondary,
                }}
              >
                Equipment
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {availableEquipment.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: `1px solid ${selectedEquipment.includes(eq) ? DARK.accent : DARK.border}`,
                      background: selectedEquipment.includes(eq)
                        ? `${DARK.accent}15`
                        : "transparent",
                      color: selectedEquipment.includes(eq) ? DARK.accent : DARK.textSecondary,
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: DARK.textSecondary }}>
            <RefreshCw size={32} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ marginTop: 16 }}>Loading energy news...</p>
          </div>
        )}

        {/* Stories Grid */}
        {!loading && stories.length > 0 && (
          <div style={{ display: "grid", gap: 20 }}>
            {stories.map((story, index) => (
              <div
                key={story.id}
                style={{
                  display: "block",
                  background: DARK.panel,
                  border: `1px solid ${DARK.border}`,
                  borderRadius: 12,
                  padding: 24,
                  color: "inherit",
                  transition: "all 0.2s",
                  position: "relative",
                  userSelect: "text",
                  WebkitUserSelect: "text",
                }}
              >
                {/* Rank Badge */}
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: index < 3 ? DARK.accent : DARK.border,
                    color: index < 3 ? DARK.bg : DARK.textSecondary,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {index + 1}
                </div>

                <div style={{ paddingLeft: 44 }}>
                  {/* Source & Time */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                      fontSize: 13,
                      color: DARK.textSecondary,
                    }}
                  >
                    <span>{story.source}</span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} />
                      {formatTimeAgo(story.publishedDate)}
                    </span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <TrendingUp size={12} />
                      Score: {Math.round(story.relevanceScore)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      marginBottom: 8,
                      color: DARK.text,
                      lineHeight: 1.4,
                    }}
                  >
                    <a
                      href={story.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: DARK.text,
                        textDecoration: "none",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = DARK.accent;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = DARK.text;
                      }}
                    >
                      {decodeHTMLEntities(story.title)}
                      <ExternalLink
                        size={16}
                        style={{ marginLeft: 8, opacity: 0.5, display: "inline" }}
                      />
                    </a>
                  </h2>

                  {/* Subtitle */}
                  {story.subtitle && (
                    <p
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: DARK.accent,
                        lineHeight: 1.5,
                        marginBottom: 12,
                      }}
                    >
                      {decodeHTMLEntities(story.subtitle)}
                    </p>
                  )}

                  {/* Summary */}
                  <p
                    style={{
                      fontSize: 15,
                      color: DARK.textSecondary,
                      lineHeight: 1.6,
                      marginBottom: 16,
                    }}
                  >
                    {decodeHTMLEntities(story.summary)}
                  </p>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                    {story.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: `${DARK.accent}10`,
                          color: DARK.accent,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {topic}
                      </span>
                    ))}
                    {story.equipment.slice(0, 2).map((eq) => (
                      <span
                        key={eq}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: `${DARK.border}`,
                          color: DARK.textSecondary,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Zap size={10} style={{ display: "inline", marginRight: 4 }} />
                        {eq}
                      </span>
                    ))}
                  </div>

                  {/* Read Full Article Button */}
                  <a
                    href={story.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 16px",
                      marginBottom: 16,
                      borderRadius: 8,
                      background: `${DARK.accent}15`,
                      border: `1px solid ${DARK.accent}`,
                      color: DARK.accent,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 600,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = DARK.accent;
                      e.currentTarget.style.color = DARK.bg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${DARK.accent}15`;
                      e.currentTarget.style.color = DARK.accent;
                    }}
                  >
                    Read Full Article
                    <ExternalLink size={14} />
                  </a>

                  {/* Social Share Buttons */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      paddingTop: 12,
                      borderTop: `1px solid ${DARK.border}`,
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Copy for Social Media Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        copyArticleForSocialMedia(story);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 16px",
                        borderRadius: 6,
                        background: copiedStoryId === story.id ? `${DARK.accent}15` : DARK.panel,
                        border: `1px solid ${copiedStoryId === story.id ? DARK.accent : DARK.border}`,
                        color: copiedStoryId === story.id ? DARK.accent : DARK.text,
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: 600,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (copiedStoryId !== story.id) {
                          e.currentTarget.style.borderColor = DARK.accent;
                          e.currentTarget.style.color = DARK.accent;
                          e.currentTarget.style.background = `${DARK.accent}10`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (copiedStoryId !== story.id) {
                          e.currentTarget.style.borderColor = DARK.border;
                          e.currentTarget.style.color = DARK.text;
                          e.currentTarget.style.background = DARK.panel;
                        }
                      }}
                      title="Copy article content for social media"
                    >
                      {copiedStoryId === story.id ? (
                        <>
                          <Check size={14} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          Copy for Social Media
                        </>
                      )}
                    </button>

                    <span
                      style={{
                        fontSize: 13,
                        color: DARK.textSecondary,
                        fontWeight: 600,
                        marginLeft: 4,
                      }}
                    >
                      Share:
                    </span>

                    {/* Twitter/X */}
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(story.url)}&text=${encodeURIComponent(story.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {}}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: DARK.panel,
                        border: `1px solid ${DARK.border}`,
                        color: DARK.textSecondary,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#1DA1F2";
                        e.currentTarget.style.color = "#1DA1F2";
                        e.currentTarget.style.background = "rgba(29, 161, 242, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = DARK.border;
                        e.currentTarget.style.color = DARK.textSecondary;
                        e.currentTarget.style.background = DARK.panel;
                      }}
                      title="Share on Twitter"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>

                    {/* LinkedIn */}
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(story.url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {}}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: DARK.panel,
                        border: `1px solid ${DARK.border}`,
                        color: DARK.textSecondary,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#0A66C2";
                        e.currentTarget.style.color = "#0A66C2";
                        e.currentTarget.style.background = "rgba(10, 102, 194, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = DARK.border;
                        e.currentTarget.style.color = DARK.textSecondary;
                        e.currentTarget.style.background = DARK.panel;
                      }}
                      title="Share on LinkedIn"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(story.url)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {}}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: DARK.panel,
                        border: `1px solid ${DARK.border}`,
                        color: DARK.textSecondary,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#1877F2";
                        e.currentTarget.style.color = "#1877F2";
                        e.currentTarget.style.background = "rgba(24, 119, 242, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = DARK.border;
                        e.currentTarget.style.color = DARK.textSecondary;
                        e.currentTarget.style.background = DARK.panel;
                      }}
                      title="Share on Facebook"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:?subject=${encodeURIComponent(story.title)}&body=${encodeURIComponent(`Check out this article: ${story.title}\n\n${story.url}`)}`}
                      onClick={() => {}}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: DARK.panel,
                        border: `1px solid ${DARK.border}`,
                        color: DARK.textSecondary,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = DARK.accent;
                        e.currentTarget.style.color = DARK.accent;
                        e.currentTarget.style.background = `${DARK.accent}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = DARK.border;
                        e.currentTarget.style.color = DARK.textSecondary;
                        e.currentTarget.style.background = DARK.panel;
                      }}
                      title="Share via Email"
                    >
                      <Mail size={14} />
                    </a>

                    {/* Copy Link */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();

                        navigator.clipboard.writeText(story.url);
                        // Could add a toast notification here
                        const btn = e.currentTarget;
                        const originalText = btn.title;
                        btn.title = "Copied!";
                        btn.style.borderColor = DARK.accent;
                        btn.style.color = DARK.accent;
                        setTimeout(() => {
                          btn.title = originalText;
                          btn.style.borderColor = DARK.border;
                          btn.style.color = DARK.textSecondary;
                        }, 2000);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: DARK.panel,
                        border: `1px solid ${DARK.border}`,
                        color: DARK.textSecondary,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = DARK.accent;
                        e.currentTarget.style.color = DARK.accent;
                        e.currentTarget.style.background = `${DARK.accent}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = DARK.border;
                        e.currentTarget.style.color = DARK.textSecondary;
                        e.currentTarget.style.background = DARK.panel;
                      }}
                      title="Copy link"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && stories.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              background: DARK.panel,
              border: `1px solid ${DARK.border}`,
              borderRadius: 12,
            }}
          >
            <Newspaper size={48} color={DARK.textSecondary} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 18, color: DARK.textSecondary }}>
              No energy news found for the selected filters.
            </p>
            <button
              onClick={() => {
                setSelectedTopics([]);
                setSelectedEquipment([]);
                setDateRange("week");
              }}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                borderRadius: 8,
                border: `1px solid ${DARK.accent}`,
                background: `${DARK.accent}15`,
                color: DARK.accent,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Clear Filters & Show Week
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
