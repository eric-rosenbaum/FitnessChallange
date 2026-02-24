//
//  Models.swift
//  FitnessChallenge
//
//  Dummy data models matching the web app types.
//

import Foundation

// MARK: - Enums
enum CardioActivity: String, CaseIterable {
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

enum CardioMetric: String, CaseIterable {
    case miles, minutes
    var displayName: String { rawValue.capitalized }
}

enum LogType: String {
    case cardio, strength
}

enum UserRole: String {
    case admin, member
}

enum MemberType: String, CaseIterable {
    case participant
    case spectator
}

// MARK: - Core Models
struct Profile: Identifiable {
    let id: String
    var displayName: String
}

struct Group: Identifiable {
    let id: String
    var name: String
    var inviteCode: String
}

struct GroupMembership: Identifiable {
    let id: String
    let groupId: String
    let userId: String
    var role: UserRole
    var memberType: MemberType
}

struct WeekAssignment: Identifiable {
    let id: String
    let groupId: String
    var startDate: String  // YYYY-MM-DD
    var endDate: String
    var hostUserId: String
}

struct StrengthExercise: Identifiable {
    let id: String
    let weekChallengeId: String
    var name: String
    var targetReps: Int
    var sortOrder: Int
}

struct WeekChallenge: Identifiable {
    let id: String
    let groupId: String
    let weekAssignmentId: String
    var cardioMetric: CardioMetric
    var cardioTarget: Double
}

/// Dummy punishment for Settings (matches web: date range, assigned users, optional cardio/strength).
struct Punishment: Identifiable {
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

/// Punishment exercise (from punishment_exercises).
struct PunishmentExercise: Identifiable {
    let id: String
    let punishmentId: String
    var name: String
    var targetReps: Int
    var sortOrder: Int
}

/// Log entry for a punishment (from punishment_logs).
struct PunishmentLog: Identifiable {
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

/// Active punishment with exercises and assigned users (for dashboard).
struct ActivePunishment {
    let punishment: Punishment
    let exercises: [PunishmentExercise]
    let assignedUserIds: [String]
}

/// Progress for one user on a punishment (like UserProgress).
struct PunishmentProgress: Identifiable {
    var id: String { userId }
    let userId: String
    var displayName: String
    var cardioTotal: Double
    var cardioProgress: Double
    var strengthOverallProgress: Double
    var totalProgress: Double
    var exerciseTotals: [String: Int]  // exerciseId -> total reps
}

struct WorkoutLog: Identifiable {
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
}

// MARK: - UI Models
struct UserProgress: Identifiable {
    var id: String { userId }
    let userId: String
    var displayName: String
    var cardioTotal: Double
    var cardioProgress: Double
    var strengthOverallProgress: Double
    var totalProgress: Double
    var exerciseTotals: [String: Int]  // exerciseId -> total reps
}

struct ActivityFeedItem: Identifiable {
    let id: String
    let userId: String
    var displayName: String
    var logType: LogType
    var cardioActivity: CardioActivity?
    var cardioAmount: Double?
    var exerciseName: String?
    var strengthReps: Int?
    var createdAt: String
}

struct ActiveWeek {
    var weekAssignment: WeekAssignment
    var challenge: WeekChallenge?
    var exercises: [StrengthExercise]
    var hostName: String
}
