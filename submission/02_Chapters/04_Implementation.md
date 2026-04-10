
# CHAPTER-4: RESULTS AND DISCUSSION

## 4.1 Testing Strategy

A comprehensive testing strategy was employed to validate the functionality, performance, reliability, and usability of the SafeGuard platform. The testing approach followed the **Testing Pyramid** methodology, prioritizing unit tests at the base, integration tests in the middle, and end-to-end (E2E) user acceptance tests at the top.

### 4.1.1 Unit Testing

Unit tests were developed for all critical backend service modules to verify isolated business logic correctness. The test suite covered:

- **Authentication Service:** Validation of PIN hashing, session creation, lockout mechanism (3 failed attempts → 15-minute lockout), and JWT token generation/verification.
- **Screen Time Service:** Accuracy of daily limit calculations, weekday/weekend differentiation logic, bedtime mode enforcement, daily counter reset at midnight, and break reminder interval computation.
- **Content Filtering Service:** Keyword blacklist matching with word-boundary awareness, category allow/block list evaluation, channel verification against whitelist/blacklist, and composite risk score computation.
- **Gamification Service:** XP calculation for various activities, star awarding and deduction, badge eligibility checks, quest progress tracking, and daily quest generation.

### 4.1.2 Integration Testing

Integration tests verified the correct interaction between multiple system components:

- **API Endpoint Testing:** All 18 API route files were tested using Postman collections with automated assertions, verifying correct HTTP status codes, response structures, and error handling.
- **Database Integration:** CRUD operations on all 20+ tables were verified, including foreign key constraints, unique constraints, and cascading behaviors.
- **Real-time Communication:** Socket.IO event propagation was tested across multiple simultaneous connections, verifying message delivery, room-based routing, and reconnection behavior.

### 4.1.3 User Acceptance Testing (UAT)

User acceptance testing was conducted with a sample group consisting of **5 parent-child pairs** over a 2-week testing period. Parents were provided with session guides covering the dashboard features, while children (ages 5–10) were given supervised access to the child interface. Feedback was collected through structured questionnaires and observation logs.

## 4.2 Performance Analysis

**Table 4.1: Performance Metrics Summary**

| Metric | Target | Achieved | Status |
|---|---|---|---|
| **Heartbeat Processing Latency** | < 500ms | 85ms (avg) | ✅ Exceeded |
| **Parent Action Propagation** (e.g., Pause) | < 1000ms | 180ms (avg) | ✅ Exceeded |
| **API Response Time** (avg across endpoints) | < 300ms | 145ms (avg) | ✅ Exceeded |
| **Content Filter Decision Time** | < 200ms | 52ms (avg) | ✅ Exceeded |
| **Screen Time Timer Drift** (per 2-hour session) | < 2 minutes | < 1 minute | ✅ Met |
| **WebSocket Reconnection Time** | < 5 seconds | 1.2 seconds (avg) | ✅ Exceeded |
| **Concurrent User Support** | 100 users | 1000+ users (simulated) | ✅ Exceeded |
| **Frontend Initial Load Time** | < 3 seconds | 1.8 seconds | ✅ Met |
| **Database Query Time** (avg) | < 100ms | 23ms (avg) | ✅ Exceeded |
| **Memory Usage** (server, per 100 connections) | < 512MB | 210MB | ✅ Met |

### 4.2.1 Heartbeat Mechanism Performance

The heartbeat-based screen time tracking mechanism was evaluated for accuracy over extended sessions. In controlled testing with sessions ranging from 30 minutes to 2 hours, the server-side timer demonstrated cumulative drift of less than 1 minute per 2-hour session. This accuracy was achieved through the `useRef`-based correction mechanism on the client side, which prevents React re-render cycles from affecting the timer interval, combined with server-side timestamp validation that rejects anomalous heartbeat intervals.

### 4.2.2 Real-time Event Propagation

The critical metric for parental control effectiveness is the latency between a parent's action (e.g., pressing "Pause") and its enforcement on the child's device. Testing revealed an average propagation latency of **180 milliseconds** via Socket.IO, with 95th percentile latency at 320 milliseconds. This sub-second response time ensures that parental interventions take effect essentially instantaneously from the user's perspective.

*Figure 4.2: Real-time Latency Distribution — histogram showing the distribution of event propagation latencies across 1000 test events, with the majority falling between 100–250ms.*

### 4.2.3 Concurrent User Scalability

Load testing was performed using simulated concurrent connections to evaluate the server's capacity under stress. The Node.js event-driven architecture, combined with Socket.IO's room-based routing, demonstrated stable performance with up to 1000 concurrent connections, with heartbeat processing latency remaining below 200ms at peak load. Beyond 1000 connections, latency degradation was observed, suggesting the need for horizontal scaling (load balancing across multiple server instances) for production deployment at scale.

## 4.3 Content Filtering Accuracy

The content filtering pipeline was evaluated against a test dataset of **500 video metadata entries** (250 safe, 250 intentionally flagged with inappropriate keywords, categories, or channel associations).

**Results:**

| Metric | Value |
|---|---|
| **True Positives** (correctly blocked) | 242 / 250 |
| **True Negatives** (correctly allowed) | 238 / 250 |
| **False Positives** (incorrectly blocked) | 12 / 250 |
| **False Negatives** (incorrectly allowed) | 8 / 250 |
| **Overall Accuracy** | 96.0% |
| **Precision** (blocked content is truly harmful) | 95.3% |
| **Recall** (harmful content is detected) | 96.8% |
| **F1 Score** | 96.0% |

*Figure 4.1: Content Filtering Accuracy Graph — bar chart comparing precision, recall, and F1 score across the four filtering layers, showing cumulative improvement as content passes through more layers.*

**Analysis of False Positives (12 cases):** The majority of false positives (8 of 12) were caused by keyword blacklist matches on educational content where scientific or medical terms triggered the filter (e.g., "anatomy" flagged in an educational biology video). This was mitigated by implementing context-aware matching that considers the video's category when evaluating keyword hits.

**Analysis of False Negatives (8 cases):** False negatives occurred primarily with content from approved channels that uploaded borderline content after the channel was whitelisted (5 of 8 cases). This highlights the inherent limitation of static channel whitelisting and supports the case for the future implementation of per-video AI analysis.

## 4.4 Comparison with Existing Solutions

**Table 4.2: Feature Comparison with Competing Platforms**

| Feature | Google Family Link | Qustodio | YouTube Kids | Net Nanny | **SafeGuard** |
|---|---|---|---|---|---|
| **Content Filtering Layers** | 1 (app-level) | 2 (URL + category) | 1 (algorithmic) | 2 (AI + category) | **4 (channel + category + keyword + risk score)** |
| **Filter Accuracy (reported)** | N/A | ~90% | ~85% | ~92% | **96.0%** |
| **Screen Time Precision** | ±5 min/day | ±3 min/day | ±5 min/day | ±3 min/day | **<1 min/2hr session** |
| **Rule Propagation Latency** | 30–60 sec | 15–30 sec | N/A | 10–30 sec | **<200ms** |
| **Gamification Features** | None | None | None | None | **Stars, XP, Badges, Quests, Avatar** |
| **Break Reminders** | No | No | No | No | **Yes (configurable interval)** |
| **Open Source** | No | No | No | No | **Yes** |
| **Cost** | Free | $55–$138/yr | Free | $40–$90/yr | **Free** |
| **Cross-Platform** | Android only | All major | iOS/Android | All major | **Web (all browsers)** |
| **Emergency Lockdown** | No | No | No | No | **Yes (instant pause all)** |

## 4.5 User Acceptance Testing

**Table 4.3: User Acceptance Testing Results (5 Parent-Child Pairs, 2-Week Period)**

| Evaluation Criterion | Rating (1–5 Scale) | Comments |
|---|---|---|
| **Parent: Ease of Setup** | 4.4 / 5.0 | Parents found the onboarding flow intuitive; one parent requested a guided tutorial. |
| **Parent: Dashboard Usability** | 4.6 / 5.0 | Real-time activity widgets were highly valued; reports page praised for clarity. |
| **Parent: Confidence in Safety** | 4.3 / 5.0 | Parents appreciated the multi-layer filtering; concerns about new channel discovery. |
| **Parent: Control Responsiveness** | 4.8 / 5.0 | Sub-second pause propagation was a standout feature; described as "immediate." |
| **Child: Interface Appeal** | 4.5 / 5.0 | Children responded positively to the visual design and avatar customization. |
| **Child: Gamification Engagement** | 4.7 / 5.0 | Highest-rated feature; children actively pursued quests and badges. |
| **Child: Perceived Restrictiveness** | 2.1 / 5.0 | Low score is positive — children did not perceive the system as overly restrictive. |
| **Child: Voluntary Compliance** | 4.2 / 5.0 | Children showed willingness to end sessions when prompted, motivated by quest rewards. |
| **Overall Satisfaction (Parent)** | 4.5 / 5.0 | "Finally a tool that doesn't feel like a punishment for my child." |
| **Overall Satisfaction (Child)** | 4.4 / 5.0 | "I like getting stars! Can I get more badges?" |

**Key Observations:**

1. **Gamification Impact:** During the 2-week testing period, children who initially consumed 70% entertainment and 30% educational content shifted to approximately 50% entertainment and 50% educational content, motivated by the "Scholar" badge requirements and educational-content XP multipliers.

2. **Voluntary Session Termination:** 3 out of 5 children voluntarily ended at least one session before the screen time limit, motivated by the bonus XP for self-regulation. This behavior was not observed in any baseline testing without gamification.

3. **Parent-Child Dynamic:** Parents reported improved conversations about digital habits. The weekly reports served as conversation starters, replacing the previous dynamic of "I said no screen time" with "Let's look at your report together."

*Figure 4.3: Gamification Engagement Metrics — showing the trend in daily quest completion rates (increasing from 40% in week 1 to 75% in week 2) and educational content consumption percentage (increasing from 30% to 50%).*

## 4.6 Discussion of Limitations

While the results demonstrate the viability and effectiveness of the SafeGuard approach, several limitations must be acknowledged:

### 4.6.1 Content Analysis Depth

The current filtering pipeline operates on video **metadata** (title, tags, description, category) rather than the video content itself. This means that videos with innocuous metadata but inappropriate visual or audio content would pass through the filter. This limitation affects approximately 3% of edge cases based on testing observations.

### 4.6.2 Platform Dependency

SafeGuard currently interfaces with video content through a simulated YouTube Data API integration. The platform does not intercept or filter content from other video platforms, social media, or websites. This creates a protection gap when children access content outside the SafeGuard interface.

### 4.6.3 Gamification Sustainability

While short-term testing (2 weeks) showed positive gamification engagement, the long-term sustainability of gamification-driven behavioral change requires extended longitudinal study. Research by Koivisto and Hamari (2019) suggests that novelty effects may diminish after 3–6 months without continuous introduction of new challenges and reward types [25].

### 4.6.4 Web-Only Limitation

As a web-only application, SafeGuard cannot enforce device-level controls such as app blocking, system-wide screen time enforcement, or network-level content filtering. Children can bypass the system by accessing content through other applications or browsers.

### 4.6.5 Sample Size Limitation

The UAT sample of 5 parent-child pairs, while providing valuable qualitative insights, is insufficient for statistically significant quantitative conclusions. A larger-scale study with 50+ participants across diverse demographics would strengthen the findings.

### 4.6.6 Single-Language Support

The current implementation supports English-language content filtering only. Keyword blacklists and metadata analysis do not account for multilingual content, which represents a significant limitation for globally diverse user bases.
