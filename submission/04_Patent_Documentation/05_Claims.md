
# 7. CLAIMS

**I/We Claim:**

1.  A system for managing screen time and digital content consumption for minors, comprising:
    a) A central server for storing usage rules and history;
    b) A client-side application that sends periodic heartbeat signals containing content metadata;
    c) A gamification engine that analyzes said metadata to award virtual currency or experience points;
    d) Wherein said virtual currency can be exchanged for additional screen time without parental intervention, subject to pre-defined limits.

2.  The system as claimed in Claim 1, wherein the screen time calculation logic resides entirely on the server to prevent client-side manipulation (e.g., changing device clock).

3.  The system as claimed in Claim 1, further comprising a real-time WebSocket layer capable of enforcing an immediate "Lock" state on the client device within 200 milliseconds of a parental command.

4.  A method for differentiating screen time usage, wherein "Educational" content decrements the daily limit at a lower rate (e.g., 0.5x) compared to "Entertainment" content (1.0x).
