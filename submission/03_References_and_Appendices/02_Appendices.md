
# APPENDICES

## Appendix A: Sample User Survey
1. Do you find current parental control apps difficult to use? (Yes/No)
2. Would you prefer a system that rewards your child for good behavior? (Yes/No)

## Appendix B: Key Code Snippets

**B.1 Heartbeat Logic (React)**
```typescript
// Heartbeat to sync usage with server
useEffect(() => {
    const sync = setInterval(() => {
        if (sessionIdRef.current && isPlayingRef.current) {
            api.patch(`/watch/${sessionIdRef.current}/update`, {
                watchedDuration: Math.floor(currentTimeRef.current),
                duration: Math.floor(durationRef.current)
            });
        }
    }, 10000); 
    return () => clearInterval(sync);
}, []);
```

**B.2 Granting Bonus Time (Node.js)**
```typescript
async grantExtraTime(childId: string, minutes: number) {
    // Logic to insert negative duration record into history
    // ...
}
```
