
# 5. DETAILED DESCRIPTION OF THE INVENTION

The invention comprises a **Server-Client Architecture** consisting of three main modules:

## Module 1: The Arbitration Server
A central processing unit that maintains the single source of truth for "Time Remaining." unlike client-side counters which can be manipulated, the server validates every "Heartbeat" signal. It calculates `RemainingTime = DailyLimit - Sum(UsageHistory) + Sum(BonusAllocations)`.

## Module 2: The Gamification Engine
This module tracks specific metadata flags in consumed content. If a video is tagged `category:educational`, the engine calculates `XP = Duration * Multiplier`. Accumulating XP triggers `BadgeUnlockEvents`, which can be exchanged for `BonusTime`, creating a self-sustaining loop of positive behavior.

## Module 3: The Real-Time Interrupt Socket
A WebSocket connection maintains a persistent state between Parent and Child. When a Parent initiates a `Pause` command, the Server broadcasts a high-priority `Lock` event to the Child Client. The Client, upon receiving this event, renders a non-dismissible overlay layer `z-index: 9999` over the operating interface.
