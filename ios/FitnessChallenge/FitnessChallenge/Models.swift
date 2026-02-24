//
//  Models.swift
//  FitnessChallenge
//
//  Dummy data models matching the web app types.
//

import Foundation

// MARK: - Enums
enum CardioActivity: String, CaseIterable, Codable {
    case run, walk, bike, other
    var displayName: String {
        switch self {
        case .run: return "Run"
        case .walk: return "Walk"
        case .bike: return "Bike"
        case .other: return "Other"
        }
    }
}

enum CardioMetric: String, CaseIterable, Codable {
    case miles, minutes
    var displayName: String { rawValue.capitalized }
}

enum LogType: String, Codable {
    case cardio, strength
}

enum UserRole: String, Codable {
    case admin, member
}

enum MemberType: String, CaseIterable, Codable {
    case participant
    case spectator
}

// MARK: - Core Models
struct Profile: Identifiable, Codable {
    let id: String
    var displayName: String
}

struct Group: Identifiable, Codable {
    let id: String
    var name: String
    var inviteCode: String
}

struct GroupMembership: Identifiable, Codable {
    let id: String
    let groupId: String
    let userId: String
    var role: UserRole
    var memberType: MemberType
}

struct WeekAssignment: Identifiable, Codable {
    let id: String
    let groupId: String
    var startDate: String  // YYYY-MM-DD
    var endDate: String
    var hostUserId: String
}

struct StrengthExercise: Identifiable, Codable {
    let id: String
    let weekChallengeId: String
    var name: String
    var targetReps: Int
    var sortOrder: Int
}

struct WeekChallenge: Identifiable, Codable {
    let id: String
    let groupId: String
    let weekAssignmentId: String
    var cardioMetric: CardioMetric
    var cardioTarget: Double
}

struct Punishment: Identifiable, Codable {
    let id: String
    let groupId: String
    var startDate: String
    var endDate: String
    var assignedUserIds: [String]
    var cardioMetric: CardioMetric?
    var cardioTarget: Double?
    var exerciseName: String?
    var exerciseTargetReps: Int?
}

struct PunishmentExercise: Identifiable, Codable {
    let id: String
    let punishmentId: String
    var name: String
    var targetReps: Int
    var sortOrder: Int
}

struct PunishmentLog: Identifiable, Codable {
    let id: String
    let groupId: String
    let punishmentId: String
    let userId: String
    var loggedAt: String
    var logType: LogType
    var cardioActivity: CardioActivity?
    var cardioAmount: Double?
    var exerciseId: String?
    var strengthReps: Int?
    var note: String?
}

struct ActivePunishment: Codable {
    let punishment: Punishment
    let exercises: [PunishmentExercise]
    let assignedUserIds: [String]
}

struct PunishmentProgress: Identifiable, Codable {
    var id: String { userId }
    let userId: String
    var displayName: String
    var cardioTotal: Double
    var cardioProgress: Double
    var strengthOverallProgress: Double
    var totalProgress: Double
    var exerciseTotals: [String: Int]  // exerciseId -> total reps
}

struct WorkoutLog: Identifiable, Codable {
    let id: String
    let groupId: String
    let weekChallengeId: String
    let userId: String
    var loggedAt: String
    var logType: LogType
    var cardioActivity: CardioActivity?
    var cardioAmount: Double?
    var exerciseId: String?
    var strengthReps: Int?
    var note: String?
    /// When the log was created (ISO 8601). If nil, use loggedAt for date-only fallback.
    var createdAt: String?

    init(id: String, groupId: String, weekChallengeId: String, userId: String, loggedAt: String, logType: LogType, cardioActivity: CardioActivity? = nil, cardioAmount: Double? = nil, exerciseId: String? = nil, strengthReps: Int? = nil, note: String? = nil, createdAt: String? = nil) {
        self.id = id
        self.groupId = groupId
        self.weekChallengeId = weekChallengeId
        self.userId = userId
        self.loggedAt = loggedAt
        self.logType = logType
        self.cardioActivity = cardioActivity
        self.cardioAmount = cardioAmount
        self.exerciseId = exerciseId
        self.strengthReps = strengthReps
        self.note = note
        self.createdAt = createdAt
    }
}

// MARK: - UI Models
struct UserProgress: Identifiable, Codable {
    var id: String { userId }
    let userId: String
    var displayName: String
    var cardioTotal: Double
    var cardioProgress: Double
    var strengthOverallProgress: Double
    var totalProgress: Double
    var exerciseTotals: [String: Int]  // exerciseId -> total reps
}

struct ActivityFeedItem: Identifiable, Codable {
    let id: String
    let userId: String
    var displayName: String
    var logType: LogType
    var cardioActivity: CardioActivity?
    var cardioAmount: Double?
    var cardioMetric: CardioMetric?
    var exerciseName: String?
    var strengthReps: Int?
    var createdAt: String
}

struct ActiveWeek: Codable {
    var weekAssignment: WeekAssignment
    var challenge: WeekChallenge?
    var exercises: [StrengthExercise]
    var hostName: String
}
