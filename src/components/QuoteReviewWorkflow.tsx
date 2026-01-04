import React, { useState, useEffect } from "react";

interface QuoteReview {
  quoteId: string;
  quoteName: string;
  status: "draft" | "in-review" | "approved" | "rejected" | "shared";
  version: number;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  reviewers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: "pending" | "approved" | "rejected" | "commented";
    approvedAt?: string;
    comments?: string;
  }>;
  comments: Array<{
    id: string;
    userId: string;
    userName: string;
    text: string;
    timestamp: string;
    resolved: boolean;
  }>;
  versionHistory: Array<{
    version: number;
    timestamp: string;
    changes: string;
    modifiedBy: string;
  }>;
  metadata: {
    projectName?: string;
    clientName?: string;
    totalValue?: number;
    requiresApproval: boolean;
    approvalThreshold?: number;
  };
}

interface QuoteReviewWorkflowProps {
  onClose: () => void;
  quoteId: string;
  quoteName: string;
  userId: string;
  userName: string;
  onStatusChange?: (status: QuoteReview["status"]) => void;
}

const QuoteReviewWorkflow: React.FC<QuoteReviewWorkflowProps> = ({
  onClose,
  quoteId,
  quoteName,
  userId,
  userName,
  onStatusChange,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "reviewers" | "comments" | "history">(
    "overview"
  );
  const [review, setReview] = useState<QuoteReview | null>(null);
  const [newComment, setNewComment] = useState("");
  const [addingReviewer, setAddingReviewer] = useState(false);
  const [newReviewer, setNewReviewer] = useState({
    name: "",
    email: "",
    role: "",
  });

  useEffect(() => {
    loadReview();
  }, [quoteId]);

  const loadReview = () => {
    const storageKey = `quote_review_${quoteId}`;
    const stored = localStorage.getItem(storageKey);

    if (stored) {
      setReview(JSON.parse(stored));
    } else {
      // Create new review
      const newReview: QuoteReview = {
        quoteId,
        quoteName,
        status: "draft",
        version: 1,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        reviewers: [],
        comments: [],
        versionHistory: [
          {
            version: 1,
            timestamp: new Date().toISOString(),
            changes: "Initial quote created",
            modifiedBy: userName,
          },
        ],
        metadata: {
          requiresApproval: true,
          approvalThreshold: 50000,
        },
      };
      setReview(newReview);
      localStorage.setItem(storageKey, JSON.stringify(newReview));
    }
  };

  const saveReview = (updatedReview: QuoteReview) => {
    const storageKey = `quote_review_${quoteId}`;
    localStorage.setItem(storageKey, JSON.stringify(updatedReview));
    setReview(updatedReview);
    if (onStatusChange) {
      onStatusChange(updatedReview.status);
    }
  };

  const handleStatusChange = (newStatus: QuoteReview["status"]) => {
    if (!review) return;

    const updatedReview = {
      ...review,
      status: newStatus,
      lastModified: new Date().toISOString(),
      versionHistory: [
        ...review.versionHistory,
        {
          version: review.version,
          timestamp: new Date().toISOString(),
          changes: `Status changed to ${newStatus}`,
          modifiedBy: userName,
        },
      ],
    };

    saveReview(updatedReview);
  };

  const handleAddReviewer = () => {
    if (!review || !newReviewer.name || !newReviewer.email) {
      alert("Please fill in all reviewer details");
      return;
    }

    const reviewer = {
      id: `reviewer-${Date.now()}`,
      name: newReviewer.name,
      email: newReviewer.email,
      role: newReviewer.role || "Reviewer",
      status: "pending" as const,
    };

    const updatedReview = {
      ...review,
      reviewers: [...review.reviewers, reviewer],
      lastModified: new Date().toISOString(),
    };

    saveReview(updatedReview);
    setNewReviewer({ name: "", email: "", role: "" });
    setAddingReviewer(false);
  };

  const handleReviewerAction = (
    reviewerId: string,
    action: "approved" | "rejected" | "commented"
  ) => {
    if (!review) return;

    const updatedReview = {
      ...review,
      reviewers: review.reviewers.map((r) =>
        r.id === reviewerId ? { ...r, status: action, approvedAt: new Date().toISOString() } : r
      ),
      lastModified: new Date().toISOString(),
    };

    // If all reviewers approved, change status to approved
    const allApproved = updatedReview.reviewers.every((r) => r.status === "approved");
    if (allApproved && updatedReview.reviewers.length > 0) {
      updatedReview.status = "approved";
    }

    saveReview(updatedReview);
  };

  const handleAddComment = () => {
    if (!review || !newComment.trim()) return;

    const comment = {
      id: `comment-${Date.now()}`,
      userId,
      userName,
      text: newComment,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    const updatedReview = {
      ...review,
      comments: [...review.comments, comment],
      lastModified: new Date().toISOString(),
    };

    saveReview(updatedReview);
    setNewComment("");
  };

  const handleResolveComment = (commentId: string) => {
    if (!review) return;

    const updatedReview = {
      ...review,
      comments: review.comments.map((c) => (c.id === commentId ? { ...c, resolved: true } : c)),
      lastModified: new Date().toISOString(),
    };

    saveReview(updatedReview);
  };

  const handleRequestReview = () => {
    if (!review) return;

    if (review.reviewers.length === 0) {
      alert("Please add at least one reviewer before requesting review");
      return;
    }

    handleStatusChange("in-review");
    alert(`Review request sent to ${review.reviewers.length} reviewer(s)`);
  };

  const handleApproveQuote = () => {
    if (!review) return;
    handleStatusChange("approved");
    alert("Quote approved! You can now share it with the client.");
  };

  const handleShareQuote = () => {
    if (!review) return;
    handleStatusChange("shared");
    alert("Quote shared with client!");
  };

  const getStatusColor = (status: QuoteReview["status"]) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "in-review":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "shared":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: QuoteReview["status"]) => {
    switch (status) {
      case "draft":
        return "📝";
      case "in-review":
        return "👀";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "shared":
        return "📤";
      default:
        return "📄";
    }
  };

  if (!review) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-8">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const unresolvedComments = review.comments.filter((c) => !c.resolved).length;
  const pendingReviewers = review.reviewers.filter((r) => r.status === "pending").length;
  const approvedReviewers = review.reviewers.filter((r) => r.status === "approved").length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{quoteName}</h2>
              <p className="text-sm text-gray-600 mt-1">Quote Review & Approval Workflow</p>
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(review.status)}`}
                >
                  {getStatusIcon(review.status)} {review.status.replace("-", " ").toUpperCase()}
                </span>
                <span className="text-xs text-gray-500">Version {review.version}</span>
                <span className="text-xs text-gray-500">
                  Modified {new Date(review.lastModified).toLocaleDateString()}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-purple-600">{review.reviewers.length}</div>
              <div className="text-xs text-gray-600">Reviewers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{pendingReviewers}</div>
              <div className="text-xs text-gray-600">Pending</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{approvedReviewers}</div>
              <div className="text-xs text-gray-600">Approved</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{unresolvedComments}</div>
              <div className="text-xs text-gray-600">Comments</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex space-x-6">
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "reviewers", label: "👥 Reviewers" },
              { id: "comments", label: "💬 Comments", badge: unresolvedComments },
              { id: "history", label: "📜 History" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === tab.id
                    ? "border-purple-600 text-purple-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Quote Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span className="font-medium">{review.createdBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Modified:</span>
                      <span className="font-medium">
                        {new Date(review.lastModified).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">v{review.version}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Review Status</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Reviewers:</span>
                      <span className="font-medium">{review.reviewers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Approved:</span>
                      <span className="font-medium text-green-600">{approvedReviewers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending:</span>
                      <span className="font-medium text-yellow-600">{pendingReviewers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Comments:</span>
                      <span className="font-medium text-blue-600">{review.comments.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workflow Actions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Workflow Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  {review.status === "draft" && (
                    <>
                      <button
                        onClick={handleRequestReview}
                        className="px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-semibold"
                      >
                        👀 Request Review
                      </button>
                      <button
                        onClick={handleApproveQuote}
                        className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                      >
                        ✅ Approve & Skip Review
                      </button>
                    </>
                  )}
                  {review.status === "in-review" && (
                    <>
                      <button
                        onClick={handleApproveQuote}
                        className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                      >
                        ✅ Approve Quote
                      </button>
                      <button
                        onClick={() => handleStatusChange("draft")}
                        className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
                      >
                        ↩️ Return to Draft
                      </button>
                    </>
                  )}
                  {review.status === "approved" && (
                    <>
                      <button
                        onClick={handleShareQuote}
                        className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                      >
                        📤 Share with Client
                      </button>
                      <button
                        onClick={() => handleStatusChange("draft")}
                        className="px-4 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
                      >
                        ✏️ Edit Quote
                      </button>
                    </>
                  )}
                  {review.status === "shared" && (
                    <div className="col-span-2 p-4 bg-blue-50 rounded-md text-center">
                      <p className="text-blue-900 font-semibold">
                        ✓ Quote has been shared with client
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Last shared: {new Date(review.lastModified).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-2">
                  {review.versionHistory
                    .slice(-5)
                    .reverse()
                    .map((entry, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-sm">
                        <span className="text-gray-400">•</span>
                        <div className="flex-1">
                          <span className="text-gray-700">{entry.changes}</span>
                          <div className="text-xs text-gray-500">
                            {entry.modifiedBy} • {new Date(entry.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Reviewers Tab */}
          {activeTab === "reviewers" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Review Team</h3>
                <button
                  onClick={() => setAddingReviewer(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                >
                  + Add Reviewer
                </button>
              </div>

              {addingReviewer && (
                <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                  <h4 className="font-semibold mb-3">Add New Reviewer</h4>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      value={newReviewer.name}
                      onChange={(e) => setNewReviewer({ ...newReviewer, name: e.target.value })}
                      placeholder="Name"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="email"
                      value={newReviewer.email}
                      onChange={(e) => setNewReviewer({ ...newReviewer, email: e.target.value })}
                      placeholder="Email"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="text"
                      value={newReviewer.role}
                      onChange={(e) => setNewReviewer({ ...newReviewer, role: e.target.value })}
                      placeholder="Role (optional)"
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddReviewer}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingReviewer(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {review.reviewers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">👥</div>
                    <p>No reviewers added yet</p>
                  </div>
                ) : (
                  review.reviewers.map((reviewer) => (
                    <div key={reviewer.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{reviewer.name}</h4>
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                reviewer.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : reviewer.status === "rejected"
                                    ? "bg-red-100 text-red-700"
                                    : reviewer.status === "commented"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {reviewer.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{reviewer.email}</p>
                          {reviewer.role && (
                            <p className="text-xs text-gray-500">{reviewer.role}</p>
                          )}
                          {reviewer.approvedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {reviewer.status} on{" "}
                              {new Date(reviewer.approvedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {reviewer.status === "pending" && review.status === "in-review" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReviewerAction(reviewer.id, "approved")}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            >
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => handleReviewerAction(reviewer.id, "rejected")}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            >
                              ✗ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === "comments" && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-3">Add Comment</h3>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add your feedback or questions..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleAddComment}
                  className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Post Comment
                </button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-lg mb-3">
                  All Comments ({review.comments.length})
                </h3>
                {review.comments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-4xl mb-2">💬</div>
                    <p>No comments yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {review.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`border rounded-lg p-4 ${
                          comment.resolved
                            ? "bg-gray-50 border-gray-200"
                            : "bg-white border-purple-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold text-gray-900">{comment.userName}</span>
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(comment.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {comment.resolved ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                              ✓ Resolved
                            </span>
                          ) : (
                            <button
                              onClick={() => handleResolveComment(comment.id)}
                              className="px-2 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded"
                            >
                              Mark Resolved
                            </button>
                          )}
                        </div>
                        <p className="text-gray-700">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div>
              <h3 className="font-semibold text-lg mb-4">Version History</h3>
              <div className="space-y-3">
                {review.versionHistory.map((entry, idx) => (
                  <div key={idx} className="border-l-4 border-purple-600 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{entry.changes}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Version {entry.version} by {entry.modifiedBy}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {review.status === "draft" && "Save as draft or request review to proceed"}
            {review.status === "in-review" && `Waiting for ${pendingReviewers} reviewer(s)`}
            {review.status === "approved" && "Quote is approved and ready to share"}
            {review.status === "shared" && "Quote has been shared with client"}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteReviewWorkflow;
