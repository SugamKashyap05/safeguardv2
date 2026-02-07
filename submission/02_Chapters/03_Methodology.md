
# CHAPTER 3: METHODOLOGY

## 3.1 System Architecture

The system follows a typical **Client-Server Architecture**:

*   **Frontend (Client):** Built with React.js + Vite. It serves two distinct interfaces:
    *   *Parent Dashboard:* For configuration and monitoring.
    *   *Child Interface:* A simplified, locked-down video player.
*   **Backend (Server):** Node.js + Express. Handles API requests, business logic, and third-party integrations (YouTube API).
*   **Database:** Supabase (PostgreSQL). Stores user profiles, screen time rules, watch history, and gamification data.
*   **Real-time Layer:** Socket.io. Facilitates instant communication (e.g., Parent pauses device -> Child device locks immediately).

[Insert Architecture Diagram Placeholder Here]

## 3.2 Data Flow Diagram (DFD)

### Level 0 DFD
*   **User (Child)** -> Request Video -> **System** -> Check Rules -> Allow/Deny.
*   **User (Parent)** -> Update Rules -> **System** -> Update Database -> Notify Child Client.

## 3.3 Algorithms Used

### 3.3.1 Time Tracking Algorithm
The system uses a "Heartbeat" mechanism. The Child Client sends a pulse every 10 seconds.
`If (Pulse Received) AND (Status != Paused) AND (DailyAllowance > 0):`
`   Decrement DailyAllowance`
`   Increment TotalUsage`
`Else:`
`   Block Content`

### 3.3.2 Content Filtering
Incoming video metadata is scanned against a blacklist of tags and keywords.
`RiskScore = Count(BlacklistMatches)`
`If RiskScore > Threshold: Block Video`
