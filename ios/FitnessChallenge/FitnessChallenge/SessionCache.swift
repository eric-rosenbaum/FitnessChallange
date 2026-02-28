//
//  SessionCache.swift
//  FitnessChallenge
//
//  Persists last session data so we can show the UI immediately while loading.
//

import Foundation

private let cacheKey = "FitnessChallenge.SessionCache"

struct SessionCache: Codable {
    var currentUserId: String
    var currentUserDisplayName: String
    var groupId: String
    var groupName: String
    var groupInviteCode: String
    var memberships: [GroupMembership]
    var activeWeek: ActiveWeek?
    var logs: [WorkoutLog]
    var leaderboard: [UserProgress]
    var profiles: [String: String]?
    var activityFeed: [ActivityFeedItem]
    var upcomingAssignments: [WeekAssignment]
    var punishments: [Punishment]
    var activePunishment: ActivePunishment?
    var punishmentLogs: [PunishmentLog]
    var punishmentProgress: PunishmentProgress?
    var punishmentLeaderboard: [PunishmentProgress]
    var leaderboardPunishment: ActivePunishment?

    static func load() -> SessionCache? {
        guard let data = UserDefaults.standard.data(forKey: cacheKey) else { return nil }
        do {
            return try JSONDecoder().decode(SessionCache.self, from: data)
        } catch {
            UserDefaults.standard.removeObject(forKey: cacheKey)
            return nil
        }
    }

    func save() {
        guard let data = try? JSONEncoder().encode(self) else { return }
        UserDefaults.standard.set(data, forKey: cacheKey)
    }

    static func clear() {
        UserDefaults.standard.removeObject(forKey: cacheKey)
    }
}
