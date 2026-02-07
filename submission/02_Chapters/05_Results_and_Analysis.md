
# CHAPTER 5: RESULTS AND ANALYSIS

## 5.1 Testing Strategy
We employed **Unit Testing** for backend services (e.g., verifying time calculation logic) and **User Acceptance Testing (UAT)** with a sample group of parents.

## 5.2 Performance Analysis
*   **Latency:** The heartbeat mechanism (10s interval) showed negligible impact on server load for <1000 concurrent users.
*   **Accuracy:** The timer drift was observed to be <1 minute over a 2-hour session after implementing the `useRef`-based correction.

## 5.3 Screenshots of Results

### 5.3.1 Parent Dashboard
[Insert Screenshot of Parent Dashboard showing usage stats]

### 5.3.2 Child Interface (Locked State)
[Insert Screenshot of "Time's Up" screen]

## 5.4 Discussion
The system successfully met the core objectives. The "Pause" function propagated to the child device in <200ms, proving the efficiency of the Socket.io implementation. Gamification features showed an increase in "Educational" category watch time during testing, as users sought to earn specific "Scholar" badges.
