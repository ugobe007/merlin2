/**
 * Energy News Page
 * Displays top 15 energy news stories from scraped sources
 */

import React, { useState, useEffect } from 'react';
import { 
  Newspaper, 
  Clock, 
  TrendingUp, 
  Filter, 
  RefreshCw,
  ExternalLink,
  Zap,
  Calendar
} from 'lucide-react';
import { 
  getTopEnergyNews, 
  getAvailableTopics, 
  getAvailableEquipment,
  getNewsStats,
  type EnergyNewsStory 
} from '@/services/energyNewsService';

const DARK = {
  bg: '#080b14',
  panel: '#0f1421',
  border: '#1e2738',
  text: '#e2e8f0',
  textSecondary: '#94a3b8',
  accent: '#3ecf8e',
};

// Decode HTML entities (e.g., &#8217; → ')
function decodeHTMLEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function EnergyNews() {
  const [stories, setStories] = useState<EnergyNewsStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [availableTopics, setAvailableTopics] = useState<string[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<string[]>([]);
  const [stats, setStats] = useState({ totalToday: 0, totalWeek: 0, totalMonth: 0, lastScraped: '' });
  const [showFilters, setShowFilters] = useState(false);

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
      console.error('Failed to load energy news:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadFilters() {
    const [topics, equipment] = await Promise.all([
      getAvailableTopics(),
      getAvailableEquipment(),
    ]);
    setAvailableTopics(topics);
    setAvailableEquipment(equipment);
  }

  async function loadStats() {
    const newsStats = await getNewsStats();
    setStats(newsStats);
  }

  function toggleTopic(topic: string) {
    setSelectedTopics(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  }

  function toggleEquipment(eq: string) {
    setSelectedEquipment(prev => 
      prev.includes(eq) ? prev.filter(e => e !== eq) : [...prev, eq]
    );
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: DARK.bg, 
      color: DARK.text,
      paddingTop: 80,
      paddingBottom: 80,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Newspaper size={32} color={DARK.accent} />
              <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0 }}>
                Energy Newsletter
              </h1>
            </div>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: DARK.panel,
                border: `1px solid ${DARK.border}`,
                borderRadius: 8,
                color: DARK.text,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
                transition: 'all 0.2s',
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
            Top 15 stories from {stats.totalToday} articles scraped today · Last updated {formatTimeAgo(stats.lastScraped)}
          </p>
        </div>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 12, 
          marginBottom: 32,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Date Range Selector */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['today', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: `1px solid ${dateRange === range ? DARK.accent : DARK.border}`,
                  background: dateRange === range ? `${DARK.accent}15` : DARK.panel,
                  color: dateRange === range ? DARK.accent : DARK.textSecondary,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                }}
              >
                {range === 'today' && `Today (${stats.totalToday})`}
                {range === 'week' && `Week (${stats.totalWeek})`}
                {range === 'month' && `Month (${stats.totalMonth})`}
              </button>
            ))}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${DARK.border}`,
              background: showFilters ? `${DARK.accent}15` : DARK.panel,
              color: showFilters ? DARK.accent : DARK.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Filter size={16} />
            Filters {(selectedTopics.length + selectedEquipment.length) > 0 && `(${selectedTopics.length + selectedEquipment.length})`}
          </button>

          {/* Refresh */}
          <button
            onClick={() => {
              loadNews();
              loadStats();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: `1px solid ${DARK.border}`,
              background: DARK.panel,
              color: DARK.text,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
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
          <div style={{
            background: DARK.panel,
            border: `1px solid ${DARK.border}`,
            borderRadius: 12,
            padding: 24,
            marginBottom: 32,
          }}>
            {/* Topics */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: DARK.textSecondary }}>
                Topics
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: `1px solid ${selectedTopics.includes(topic) ? DARK.accent : DARK.border}`,
                      background: selectedTopics.includes(topic) ? `${DARK.accent}15` : 'transparent',
                      color: selectedTopics.includes(topic) ? DARK.accent : DARK.textSecondary,
                      cursor: 'pointer',
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
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: DARK.textSecondary }}>
                Equipment
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {availableEquipment.map(eq => (
                  <button
                    key={eq}
                    onClick={() => toggleEquipment(eq)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      border: `1px solid ${selectedEquipment.includes(eq) ? DARK.accent : DARK.border}`,
                      background: selectedEquipment.includes(eq) ? `${DARK.accent}15` : 'transparent',
                      color: selectedEquipment.includes(eq) ? DARK.accent : DARK.textSecondary,
                      cursor: 'pointer',
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
          <div style={{ textAlign: 'center', padding: 60, color: DARK.textSecondary }}>
            <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: 16 }}>Loading energy news...</p>
          </div>
        )}

        {/* Stories Grid */}
        {!loading && stories.length > 0 && (
          <div style={{ display: 'grid', gap: 20 }}>
            {stories.map((story, index) => (
              <a
                key={story.id}
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  background: DARK.panel,
                  border: `1px solid ${DARK.border}`,
                  borderRadius: 12,
                  padding: 24,
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = DARK.accent;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = DARK.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Rank Badge */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: index < 3 ? DARK.accent : DARK.border,
                  color: index < 3 ? DARK.bg : DARK.textSecondary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                }}>
                  {index + 1}
                </div>

                <div style={{ paddingLeft: 44 }}>
                  {/* Source & Time */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 12,
                    fontSize: 13,
                    color: DARK.textSecondary,
                  }}>
                    <span>{story.source}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} />
                      {formatTimeAgo(story.publishedDate)}
                    </span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TrendingUp size={12} />
                      Score: {Math.round(story.relevanceScore)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 style={{ 
                    fontSize: 20, 
                    fontWeight: 700, 
                    marginBottom: 12,
                    color: DARK.text,
                    lineHeight: 1.4,
                  }}>
                    {decodeHTMLEntities(story.title)}
                    <ExternalLink size={16} style={{ marginLeft: 8, opacity: 0.5 }} />
                  </h2>

                  {/* Summary */}
                  <p style={{ 
                    fontSize: 15, 
                    color: DARK.textSecondary, 
                    lineHeight: 1.6,
                    marginBottom: 16,
                  }}>
                    {decodeHTMLEntities(story.summary)}
                  </p>

                  {/* Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {story.topics.slice(0, 3).map(topic => (
                      <span
                        key={topic}
                        style={{
                          padding: '4px 10px',
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
                    {story.equipment.slice(0, 2).map(eq => (
                      <span
                        key={eq}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          background: `${DARK.border}`,
                          color: DARK.textSecondary,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Zap size={10} style={{ display: 'inline', marginRight: 4 }} />
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && stories.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 60,
            background: DARK.panel,
            border: `1px solid ${DARK.border}`,
            borderRadius: 12,
          }}>
            <Newspaper size={48} color={DARK.textSecondary} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 18, color: DARK.textSecondary }}>
              No energy news found for the selected filters.
            </p>
            <button
              onClick={() => {
                setSelectedTopics([]);
                setSelectedEquipment([]);
                setDateRange('week');
              }}
              style={{
                marginTop: 16,
                padding: '10px 20px',
                borderRadius: 8,
                border: `1px solid ${DARK.accent}`,
                background: `${DARK.accent}15`,
                color: DARK.accent,
                cursor: 'pointer',
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
