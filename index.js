import axios from "axios";

class Sessions {
    constructor() {
        this.visitorMap = {};
        this.sessionsMap = {};
    }

    // Initialize a map with visitorId as key and an array of visits as value
    initializeMap = (events) => {
        for (const i in events) {
            const event = events[i];
            const visitorId = event.visitorId;
            const visitorObj = {
                url: event.url,
                timestamp: event.timestamp
            };

            if (visitorId in this.visitorMap) {
                this.visitorMap[visitorId].push(visitorObj);
            } else {
                this.visitorMap[visitorId] = [visitorObj];
            }
        }
    }

    // For each visitor in the map, sort their visits by timestamp
    sortVisitsByTimestamp = () => {
        for (const visitorId in this.visitorMap) {
            this.visitorMap[visitorId].sort((a, b) => {
                return a.timestamp - b.timestamp;
            });
        }
    }

    // Group the visits into sessions
    createSessions = () => {
        for (const visitorId in this.visitorMap) {
            const visits = this.visitorMap[visitorId];
            this.sessionsMap[visitorId] = [];

            // Case where visitor only visited one site
            if (visits.length === 1) {
                this.sessionsMap[visitorId].push({
                    duration: 0,
                    pages: [visits[0].url],
                    startTime: visits[0].timestamp
                });
            // Otherwise traverse and group visits
            } else {
                let currStart = visits[0].timestamp;
                let pages = [visits[0].url];
                for (let i = 1; i < visits.length; i++) {
                    if (visits[i].timestamp - visits[i-1].timestamp > 600000) {
                        this.sessionsMap[visitorId].push({
                            duration: visits[i-1].timestamp - currStart,
                            pages: pages,
                            startTime: currStart
                        });
                        currStart = visits[i].timestamp;
                        pages = [visits[i].url];
                    } else {
                        pages.push(visits[i].url);
                    }
                    // If reached last index, add remaining session
                    if (i === (visits.length - 1)) {
                        this.sessionsMap[visitorId].push({
                            duration: visits[i].timestamp - currStart,
                            pages: pages,
                            startTime: currStart
                        });
                    }
                }
            }
        }
    }
}

axios.get("https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=ca31900db5e744573256d2c677ff")
    .then((res) => {
        const events = res.data.events;
        const sessions = new Sessions();

        sessions.initializeMap(events);
        sessions.sortVisitsByTimestamp();
        sessions.createSessions();

        const finalResult = {
            sessionsByUser: sessions.sessionsMap
        };

        axios.post("https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=ca31900db5e744573256d2c677ff", finalResult)
            .then((res) => {
                console.log(res.status);
            });
    });
